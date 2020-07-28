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
import { commands, window, workspace } from "vscode";
import createSimpleGit from "simple-git";

export class GitSyncer implements Syncer {
	private readonly git = createSimpleGit();

	async init() {
		const repoFolder = Environment.repoFolder();

		await FS.mkdir(repoFolder);

		await this.git.cwd(repoFolder);

		const isRepo = await this.git.checkIsRepo();

		if (!isRepo) {
			Logger.info("Initializing git repository inside export path...");
			await this.git.init();

			const { exportPath } = await Settings.local.get();

			Logger.info("Adding new remote:", exportPath);
			await this.git.addRemote("origin", exportPath);
		}
	}

	async upload() {
		await this.exportFiles();

		await this.cleanUp(
			Environment.userFolder(),
			await Environment.currentProfileFolder(),
		);

		const installedExtensions = Extensions.get();

		Logger.info("Installed extensions:", installedExtensions);

		const profile = await Profiles.getCurrent();

		await Profiles.update(profile.name, {
			extensions: installedExtensions,
		});

		await this.git.add(".");
		await this.git.commit(`Update [${new Date().toLocaleString()}]`);
		await this.git.push("origin", "master", { "--force": null });
	}

	async download() {
		await this.exportFiles();

		const stash = (await this.git.stash()).trim();

		await this.git.pull("origin", "master");

		if (stash !== "No local changes to save") {
			Logger.info("Reapplying local changes...");
			await this.git.stash(["pop"]);
		}

		await this.importFiles();

		await this.cleanUp(
			await Environment.currentProfileFolder(),
			Environment.userFolder(),
		);

		const profile = await Profiles.getCurrent();

		Logger.info("Extensions parsed from downloaded file:", profile.extensions);

		await Extensions.install(...Extensions.getMissing(profile.extensions));

		const toUninstall = Extensions.getUnneeded(profile.extensions);

		Logger.info("Extensions to uninstall:", toUninstall);

		if (toUninstall.length > 0) {
			const needToReload = await Extensions.uninstall(...toUninstall);

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

	private async exportFiles(): Promise<void> {
		const userFolder = Environment.userFolder();
		const currentProfileFolder = await Environment.currentProfileFolder();
		const files = await FS.listFiles(userFolder);

		Logger.info(
			"Files to export:",
			files.map((file) => relative(userFolder, file)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(
					currentProfileFolder,
					relative(userFolder, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					await FS.write(newPath, Pragma.outgoing(await FS.read(file)));
				} else {
					await FS.copy(file, newPath);
				}
			}),
		);
	}

	private async importFiles(): Promise<void> {
		const userFolder = Environment.userFolder();
		const conflictsFolder = Environment.conflictsFolder();
		const currentProfileFolder = await Environment.currentProfileFolder();

		const { hostname } = await Settings.local.get();

		const files = await FS.listFiles(currentProfileFolder);

		Logger.info(
			"Files to import:",
			files.map((file) => relative(currentProfileFolder, file)),
		);

		const conflictRegexes = [/^<{7}$/, /^={7}$/, /^>{7}$/];

		const hasConflict = (text: string) => {
			return text
				.split("\n")
				.some((v) => conflictRegexes.some((regex) => regex.test(v)));
		};

		const promises = files.map((file) => async () => {
			let contents = await FS.readBuffer(file);

			if (hasConflict(contents.toString())) {
				await FS.mkdir(conflictsFolder);

				const temporaryPath = resolve(
					conflictsFolder,
					`syncify-conflict:${basename(file)}`,
				);

				await FS.copy(file, temporaryPath);

				await window.showTextDocument(
					await workspace.openTextDocument(temporaryPath),
				);

				await new Promise((resolve) => {
					const disposable = commands.registerCommand(
						"syncify.resolveConflict",
						() => {
							disposable.dispose();
							resolve();
							return commands.executeCommand(
								"workbench.action.closeActiveEditor",
							);
						},
					);
				});

				contents = await FS.readBuffer(temporaryPath);

				await FS.remove(temporaryPath);
			}

			const newPath = resolve(userFolder, relative(currentProfileFolder, file));

			await FS.mkdir(dirname(newPath));

			if (file.endsWith(".json")) {
				await FS.write(newPath, Pragma.incoming(contents.toString(), hostname));
			} else {
				await FS.write(newPath, contents);
			}
		});

		await promises.reduce((acc, next) => acc.then(next), Promise.resolve());
	}

	/** Deletes all files in `destination` that are not in `source`. */
	private async cleanUp(source: string, destination: string): Promise<void> {
		const [sourceFiles, destFiles] = await Promise.all([
			FS.listFiles(source),
			FS.listFiles(destination),
		]);

		const unneeded = destFiles.filter((file) => {
			const correspondingFile = resolve(source, relative(destination, file));
			return !sourceFiles.includes(correspondingFile);
		});

		Logger.info("Unneeded files:", unneeded);

		await FS.remove(...unneeded);
	}
}
