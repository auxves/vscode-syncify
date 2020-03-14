import cloneDeep from "lodash/cloneDeep";
import { DeepPartial } from "utility-types";
import { commands, ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings } from "~/models";
import {
	Environment,
	FS,
	localize,
	Logger,
	Watcher,
	Webview
} from "~/services";
import { confirm, merge, stringifyPretty } from "~/utilities";

export namespace Settings {
	export async function get(): Promise<ISettings>;
	export async function get<T>(selector: (s: ISettings) => T): Promise<T>;
	export async function get<T>(selector?: (s: ISettings) => T): Promise<T> {
		const exists = await FS.exists(Environment.settings);

		if (!exists) {
			await FS.mkdir(Environment.globalStoragePath);
			await FS.write(Environment.settings, stringifyPretty(defaultSettings));

			if (selector) return cloneDeep(selector(defaultSettings));

			return cloneDeep<any>(defaultSettings);
		}

		try {
			const contents = await FS.read(Environment.settings);
			const settings = JSON.parse(contents);

			const merged = merge(defaultSettings, settings);

			if (selector) return cloneDeep(selector(merged));

			return cloneDeep(merged);
		} catch (error) {
			Logger.error(error);

			if (selector) return cloneDeep(selector(defaultSettings));

			return cloneDeep<any>(defaultSettings);
		}
	}

	export async function set(settings: DeepPartial<ISettings>): Promise<void> {
		const exists = await FS.exists(Environment.globalStoragePath);
		if (!exists) await FS.mkdir(Environment.globalStoragePath);

		const currentSettings = await get();

		await FS.write(
			Environment.settings,
			stringifyPretty(merge(currentSettings, settings))
		);

		await commands.executeCommand("syncify.reinitialize");
	}

	export async function open() {
		return Webview.openSettingsPage(await get());
	}

	export async function openFile() {
		await window.showTextDocument(
			await workspace.openTextDocument(Environment.settings),
			ViewColumn.One,
			true
		);
	}

	export async function reset(): Promise<void> {
		const userIsSure = await confirm("settings -> reset");

		if (!userIsSure) return;

		Watcher.stop();

		await FS.remove(Environment.globalStoragePath);

		await commands.executeCommand("syncify.reinitialize");

		window.showInformationMessage(localize("(info) reset -> complete"));
	}
}
