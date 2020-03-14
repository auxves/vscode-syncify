import { basename } from "path";
import { commands, extensions, ProgressLocation, Uri, window } from "vscode";
import { Environment, FS, localize } from "~/services";

export namespace Extensions {
	export async function install(...ids: string[]): Promise<void> {
		const vsixFiles = await FS.listFiles(Environment.vsixFolder, []);

		await window.withProgress(
			{
				location: ProgressLocation.Notification
			},
			async progress => {
				const increment = 100 / ids.length;

				return Promise.all(
					ids.map(async ext => {
						const matchingVsix = `${ext.toLowerCase()}.vsix`;

						const vsix = vsixFiles.find(
							file => basename(file).toLowerCase() === matchingVsix
						);

						await commands.executeCommand(
							"workbench.extensions.installExtension",
							vsix ? Uri.file(vsix) : ext
						);

						progress.report({
							increment,
							message: localize("(info) extensions -> installed", ext)
						});
					})
				);
			}
		);
	}

	export async function uninstall(...ids: string[]): Promise<void> {
		await window.withProgress(
			{
				location: ProgressLocation.Notification
			},
			async progress => {
				const increment = 100 / ids.length;

				return Promise.all(
					ids.map(async ext => {
						await commands.executeCommand(
							"workbench.extensions.uninstallExtension",
							ext
						);

						progress.report({
							increment,
							message: localize("(info) extensions -> uninstalled", ext)
						});
					})
				);
			}
		);
	}

	export function get(): string[] {
		return extensions.all
			.filter(ext => !ext.packageJSON.isBuiltin)
			.map(ext => ext.id);
	}

	export function getMissing(downloadedExtensions: string[]): string[] {
		const installed = get();
		return downloadedExtensions.filter(ext => !installed.includes(ext));
	}

	export function getUnneeded(downloadedExtensions: string[]): string[] {
		return get().filter(ext => !downloadedExtensions.includes(ext));
	}
}
