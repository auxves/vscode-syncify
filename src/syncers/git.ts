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
		const repoFolder = Environment.repoFolder();

		await FS.mkdir(repoFolder);

		await this.git.cwd(repoFolder);

		const isRepo = await this.git.checkIsRepo();

		if (!isRepo) {
			Logger.info("Repo folder is not a git repo, initializing...");
			await this.git.init();
		}

		const remotes = await this.git.getRemotes(true);
		const origin = remotes.find((remote) => remote.name === "origin");

		const { exportPath } = await Settings.local.get();

		if (!origin) {
			Logger.info("Adding new remote:", exportPath);
			await this.git.addRemote("origin", exportPath);
		} else if (origin.refs.push !== exportPath) {
			Logger.info("Wrong remote url, changing to:", exportPath);
			await this.git.removeRemote("origin");
			await this.git.addRemote("origin", exportPath);
		}
	}

	async upload() {
		await this.copyFilesToRepo();
		await this.cleanUpRepo();

		const installedExtensions = Extensions.get();

		Logger.info("Installed extensions:", installedExtensions);

		const profile = await Profiles.getCurrent();

		await Profiles.update(profile.name, {
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

		const profile = await Profiles.getCurrent();

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
		const profileValid = await Profiles.isCurrentValid();

		return Boolean(exportPath && profileValid);
	}

	private async copyFilesToRepo(): Promise<void> {
		const profile = await Profiles.getCurrent();
		const userFolder = Environment.userFolder();
		const files = await FS.listFiles(userFolder);

		Logger.info(
			"Files to copy to repo:",
			files.map((file) => relative(userFolder, file)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(
					userFolder,
					profile.name,
					relative(userFolder, file),
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
		const profile = await Profiles.getCurrent();
		const repoFolder = Environment.repoFolder();
		const exportPath = resolve(repoFolder, profile.name);

		const files = await FS.listFiles(exportPath);

		Logger.info(
			"Files to copy from repo:",
			files.map((file) => relative(exportPath, file)),
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
					const conflictsFolder = Environment.conflictsFolder();

					await FS.mkdir(conflictsFolder);

					const temporaryPath = resolve(
						conflictsFolder,
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
					Environment.userFolder(),
					relative(exportPath, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					const afterPragma = Pragma.incoming(contents.toString(), hostname);
					await FS.write(newPath, afterPragma);
				} else {
					await FS.write(newPath, contents);
				}
			}),
		);
	}

	private async cleanUpRepo(): Promise<void> {
		const profile = await Profiles.getCurrent();
		const userFolder = Environment.userFolder();
		const exportPath = resolve(Environment.repoFolder(), profile.name);

		const [repoFiles, userFiles] = await Promise.all([
			FS.listFiles(exportPath),
			FS.listFiles(userFolder),
		]);

		Logger.info(
			"Files in the repo folder:",
			repoFiles.map((file) => relative(exportPath, file)),
		);

		Logger.info(
			"Files in the user folder:",
			userFiles.map((file) => relative(userFolder, file)),
		);

		const unneeded = repoFiles.filter((file) => {
			const correspondingFile = resolve(userFolder, relative(exportPath, file));
			return !userFiles.includes(correspondingFile);
		});

		Logger.info("Unneeded files:", unneeded);

		await FS.remove(...unneeded);
	}

	private async cleanUpUser(): Promise<void> {
		const profile = await Profiles.getCurrent();
		const userFolder = Environment.userFolder();
		const exportPath = resolve(Environment.repoFolder(), profile.name);

		const [repoFiles, userFiles] = await Promise.all([
			FS.listFiles(exportPath),
			FS.listFiles(userFolder),
		]);

		Logger.info(
			"Files in the repo folder:",
			repoFiles.map((file) => relative(exportPath, file)),
		);

		Logger.info(
			"Files in the user folder:",
			userFiles.map((file) => relative(userFolder, file)),
		);

		const unneeded = userFiles.filter((file) => {
			const correspondingFile = resolve(exportPath, relative(userFolder, file));
			return !repoFiles.includes(correspondingFile);
		});

		Logger.info("Unneeded files:", unneeded);

		await FS.remove(...unneeded);
	}
}
