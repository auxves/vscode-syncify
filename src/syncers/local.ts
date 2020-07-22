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
import { dirname, relative, resolve } from "path";
import { commands, extensions, window } from "vscode";
import { Syncer } from "~/models";

export class LocalSyncer implements Syncer {
	async init() {
		await FS.mkdir(await Environment.currentProfileFolder());
	}

	async upload() {
		const profile = (await Profiles.getCurrent())!;
		const currentProfileFolder = await Environment.currentProfileFolder();

		const installedExtensions = Extensions.get();

		await Profiles.update(profile.name, {
			extensions: installedExtensions,
		});

		await this.copyFilesToPath(currentProfileFolder);
	}

	async download() {
		const { hostname } = await Settings.local.get();
		const currentProfileFolder = await Environment.currentProfileFolder();

		await this.copyFilesFromPath(currentProfileFolder, hostname);

		const profile = (await Profiles.getCurrent())!;

		Logger.info(
			"Extensions parsed from downloaded settings:",
			profile.extensions,
		);

		await Extensions.install(...Extensions.getMissing(profile.extensions));

		const toDelete = Extensions.getUnneeded(profile.extensions);

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

	private async copyFilesToPath(exportPath: string) {
		const userFolder = Environment.userFolder();

		const files = await FS.listFiles(userFolder);

		Logger.info(
			"Files to copy to folder:",
			files.map((f) => relative(userFolder, f)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(exportPath, relative(userFolder, file));

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					return FS.write(newPath, Pragma.outgoing(await FS.read(file)));
				}

				return FS.copy(file, newPath);
			}),
		);
	}

	private async copyFilesFromPath(exportPath: string, hostname: string) {
		const files = await FS.listFiles(exportPath);

		Logger.info(
			"Files to copy from folder:",
			files.map((f) => relative(exportPath, f)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(
					Environment.userFolder(),
					relative(exportPath, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					const currentContents = (await FS.exists(newPath))
						? await FS.read(newPath)
						: "{}";

					const afterPragma = Pragma.incoming(await FS.read(file), hostname);

					if (currentContents !== afterPragma) {
						await FS.write(newPath, afterPragma);
					}
				} else {
					await FS.copy(file, newPath);
				}
			}),
		);
	}
}
