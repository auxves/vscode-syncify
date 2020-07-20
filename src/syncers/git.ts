import {
	Environment,
	Extensions,
	FS,
	localize,
	Logger,
	Pragma,
	Profiles,
	Settings,
} from "~/services";
import { basename, dirname, relative, resolve } from "path";
import { Syncer } from "~/models";
import { commands, extensions, ViewColumn, window, workspace } from "vscode";
import createSimpleGit from "simple-git";

export class GitSyncer implements Syncer {
	private readonly git = createSimpleGit();

	async init() {
		await FS.mkdir(Environment.repoFolder);

		await this.git.cwd(Environment.repoFolder);

		const isRepo = await this.git.checkIsRepo();

		if (!isRepo) {
			Logger.info("Repo folder is not a git repo, initializing...");
			await this.git.init();
		}

		const remotes = await this.git.getRemotes(true);
		const origin = remotes.find((remote) => remote.name === "origin");

		const { exportPath } = await Settings.local.get();

		if (!origin) {
			Logger.info(`Adding new remote "origin" at "${exportPath}"`);
			await this.git.addRemote("origin", exportPath);
		} else if (origin.refs.push !== exportPath) {
			Logger.info(
				`Wrong remote url for "origin", removing and adding new origin at "${exportPath}"`,
			);

			await this.git.removeRemote("origin");
			await this.git.addRemote("origin", exportPath);
		}
	}

	async upload() {
		await this.copyFilesToRepo();
		await this.cleanUpRepo();

		const installedExtensions = Extensions.get();

		Logger.info("Installed extensions:", installedExtensions);

		const profile = (await Profiles.getCurrent())!;

		await Profiles.updateProfile(profile.name, {
			extensions: installedExtensions,
		});

		await this.git.add(".");
		await this.git.commit(`Update [${new Date().toLocaleString()}]`);
		await this.git.push("origin", "master");
	}

	async download() {
		const { hostname } = await Settings.local.get();

		await this.copyFilesToRepo();

		const stash = await this.git.stash();

		await this.git.pull("origin", "master");

		if (stash.trim() !== "No local changes to save") {
			Logger.info("Reapplying local changes");
			await this.git.stash(["pop"]);
		}

		await this.copyFilesFromRepo(hostname);
		await this.cleanUpUser();

		const profile = (await Profiles.getCurrent())!;

		Logger.info("Extensions parsed from downloaded file:", profile.extensions);

		await Extensions.install(...Extensions.getMissing(profile.extensions));

		const toDelete = Extensions.getUnneeded(profile.extensions);

		Logger.info("Extensions to delete:", toDelete);

		if (toDelete.length !== 0) {
			const needToReload = toDelete.some(
				(name) => extensions.getExtension(name)?.isActive ?? false,
			);

			Logger.info("Need to reload:", needToReload);

			await Extensions.uninstall(...toDelete);

			if (needToReload) {
				const result = await window.showInformationMessage(
					localize("(info) Syncer.download -> reload confirmation"),
					localize("(label) yes"),
				);

				if (result) {
					await commands.executeCommand("workbench.action.reloadWindow");
				}
			}
		}
	}

	async isConfigured() {
		const { exportPath } = await Settings.local.get();
		const profile = await Profiles.getCurrent();

		return Boolean(exportPath && profile);
	}

	private async copyFilesToRepo(): Promise<void> {
		const profile = (await Profiles.getCurrent())!;

		const files = await FS.listFiles(Environment.userFolder);

		Logger.info(
			"Files to copy to repo:",
			files.map((f) => relative(Environment.userFolder, f)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(
					Environment.repoFolder,
					profile.name,
					relative(Environment.userFolder, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					return FS.write(newPath, Pragma.outgoing(await FS.read(file)));
				}

				return FS.copy(file, newPath);
			}),
		);
	}

	private async copyFilesFromRepo(hostname: string): Promise<void> {
		const profile = (await Profiles.getCurrent())!;

		const exportPath = resolve(Environment.repoFolder, profile.name);

		const files = await FS.listFiles(exportPath);

		Logger.info(
			"Files to copy from repo:",
			files.map((f) => relative(exportPath, f)),
		);

		await Promise.all(
			files.map(async (file) => {
				let contents = await FS.readBuffer(file);

				const hasConflict = (text: string) => {
					const regexes = [/^<{7}$/, /^={7}$/, /^>{7}$/];

					return !text
						.split("\n")
						.every((v) => regexes.every((r) => !r.test(v)));
				};

				if (hasConflict(contents.toString())) {
					await FS.mkdir(Environment.conflictsFolder);

					const temporaryPath = resolve(
						Environment.conflictsFolder,
						`${Math.random()}-${basename(file)}`,
					);

					await FS.copy(file, temporaryPath);

					const doc = await workspace.openTextDocument(temporaryPath);

					await window.showTextDocument(doc, ViewColumn.One, true);

					await new Promise((resolve) => {
						const d = workspace.onDidSaveTextDocument((document) => {
							if (
								document.fileName === doc.fileName &&
								!hasConflict(document.getText())
							) {
								d.dispose();
								resolve();
								return commands.executeCommand(
									"workbench.action.closeActiveEditor",
								);
							}
						});
					});

					contents = await FS.readBuffer(temporaryPath);

					await FS.remove(temporaryPath);
				}

				const newPath = resolve(
					Environment.userFolder,
					relative(exportPath, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					const currentContents = await (async () => {
						if (await FS.exists(newPath)) return FS.read(newPath);
						return "{}";
					})();

					const afterPragma = Pragma.incoming(contents.toString(), hostname);

					if (currentContents !== afterPragma) {
						return FS.write(newPath, afterPragma);
					}

					return;
				}

				return FS.write(newPath, contents);
			}),
		);
	}

	private async cleanUpRepo(): Promise<void> {
		const profile = (await Profiles.getCurrent())!;

		const exportPath = resolve(Environment.repoFolder, profile.name);

		const [repoFiles, userFiles] = await Promise.all([
			FS.listFiles(exportPath),
			FS.listFiles(Environment.userFolder),
		]);

		Logger.info(
			"Files in the repo folder:",
			repoFiles.map((f) => relative(exportPath, f)),
		);

		Logger.info(
			"Files in the user folder:",
			userFiles.map((f) => relative(Environment.userFolder, f)),
		);

		const unneeded = repoFiles.filter((f) => {
			const correspondingFile = resolve(
				Environment.userFolder,
				relative(exportPath, f),
			);

			return !userFiles.includes(correspondingFile);
		});

		Logger.info("Unneeded files:", unneeded);

		await FS.remove(...unneeded);
	}

	private async cleanUpUser(): Promise<void> {
		const profile = (await Profiles.getCurrent())!;

		const exportPath = resolve(Environment.repoFolder, profile.name);

		const [repoFiles, userFiles] = await Promise.all([
			FS.listFiles(exportPath),
			FS.listFiles(Environment.userFolder),
		]);

		Logger.info(
			"Files in the repo folder:",
			repoFiles.map((f) => relative(exportPath, f)),
		);

		Logger.info(
			"Files in the user folder:",
			userFiles.map((f) => relative(Environment.userFolder, f)),
		);

		const unneeded = userFiles.filter((f) => {
			const correspondingFile = resolve(
				exportPath,
				relative(Environment.userFolder, f),
			);

			return !repoFiles.includes(correspondingFile);
		});

		Logger.info("Unneeded files:", unneeded);

		await FS.remove(...unneeded);
	}
}
