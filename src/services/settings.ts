import { dirname } from "path";
import {
	defaultLocalSettings,
	defaultSharedSettings,
	LocalSettings,
	SharedSettings,
} from "~/models";
import { Environment, FS, localize, Logger } from "~/services";
import { commands, window, workspace } from "vscode";

const stringify = (object: any) => JSON.stringify(object, undefined, 2);

export namespace Settings {
	export namespace local {
		export const get = async (): Promise<LocalSettings> => {
			const settingsPath = Environment.localSettings;

			const exists = await FS.exists(settingsPath);

			if (!exists) {
				await FS.mkdir(dirname(settingsPath));
				await FS.write(settingsPath, stringify(defaultLocalSettings));
				return defaultLocalSettings;
			}

			try {
				return JSON.parse(await FS.read(settingsPath));
			} catch (error) {
				void Logger.error(error);
				return defaultLocalSettings;
			}
		};

		export const set = async (settings: Partial<LocalSettings>) => {
			const settingsPath = Environment.localSettings;

			await FS.mkdir(dirname(settingsPath));

			const currentSettings = await get();

			await FS.write(
				settingsPath,
				stringify({ ...currentSettings, ...settings }),
			);

			await commands.executeCommand("syncify.reinitialize");
		};
	}

	export namespace shared {
		export const get = async (): Promise<SharedSettings> => {
			const settingsPath = await Environment.sharedSettings;

			const exists = await FS.exists(settingsPath);

			if (!exists) {
				await FS.mkdir(dirname(settingsPath));
				await FS.write(settingsPath, stringify(defaultSharedSettings));
				return defaultSharedSettings;
			}

			try {
				return JSON.parse(await FS.read(settingsPath));
			} catch (error) {
				void Logger.error(error);
				return defaultSharedSettings;
			}
		};

		export const set = async (settings: Partial<SharedSettings>) => {
			const settingsPath = await Environment.sharedSettings;

			await FS.mkdir(dirname(settingsPath));

			const currentSettings = await get();

			await FS.write(
				settingsPath,
				stringify({ ...currentSettings, ...settings }),
			);

			await commands.executeCommand("syncify.reinitialize");
		};
	}

	export const open = async () => {
		await window.showTextDocument(
			await workspace.openTextDocument(Environment.localSettings),
		);
	};

	export const reset = async () => {
		const response = await window.showWarningMessage(
			localize("(prompt) Settings.reset -> confirmation"),
			localize("(label) yes"),
			localize("(label) no"),
		);

		if (response !== localize("(label) yes")) return;

		await FS.remove(Environment.globalStoragePath);

		await commands.executeCommand("syncify.reinitialize");

		await window.showInformationMessage(
			localize("(info) Settings.reset -> complete"),
		);
	};
}
