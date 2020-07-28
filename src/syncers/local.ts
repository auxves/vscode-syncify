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
		const userFolder = Environment.userFolder();
		const currentProfileFolder = await Environment.currentProfileFolder();

		const profile = await Profiles.getCurrent();

		const installedExtensions = Extensions.get();

		await Profiles.update(profile.name, {
			extensions: installedExtensions,
		});

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

	async download() {
		const userFolder = Environment.userFolder();
		const currentProfileFolder = await Environment.currentProfileFolder();

		const { hostname } = await Settings.local.get();

		const files = await FS.listFiles(currentProfileFolder);

		Logger.info(
			"Files to import:",
			files.map((file) => relative(currentProfileFolder, file)),
		);

		await Promise.all(
			files.map(async (file) => {
				const newPath = resolve(
					userFolder,
					relative(currentProfileFolder, file),
				);

				await FS.mkdir(dirname(newPath));

				if (file.endsWith(".json")) {
					await FS.write(
						newPath,
						Pragma.incoming(await FS.read(file), hostname),
					);
				} else {
					await FS.copy(file, newPath);
				}
			}),
		);

		const profile = await Profiles.getCurrent();

		Logger.info(
			"Extensions parsed from downloaded settings:",
			profile.extensions,
		);

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
}
