import { Environment, FS, localize } from "~/services";
import { basename } from "path";
import { commands, extensions, ProgressLocation, Uri, window } from "vscode";

export const install = async (...ids: string[]) => {
	const increment = 100 / ids.length;

	const vsixFiles = await FS.listFiles(await Environment.vsixFolder());

	await window.withProgress(
		{ location: ProgressLocation.Notification },
		async (progress) => {
			return Promise.all(
				ids.map(async (id) => {
					const matchingVsix = `${id}.vsix`;

					const vsix = vsixFiles.find(
						(path) => basename(path) === matchingVsix,
					);

					await commands.executeCommand(
						"workbench.extensions.installExtension",
						vsix ? Uri.file(vsix) : id,
					);

					progress.report({
						increment,
						message: localize("(info) Extensions.install -> installed", id),
					});
				}),
			);
		},
	);
};

export const uninstall = async (...ids: string[]) => {
	const increment = 100 / ids.length;

	const needToReload = ids.some(
		(id) => extensions.getExtension(id)?.isActive ?? false,
	);

	await window.withProgress(
		{ location: ProgressLocation.Notification },
		async (progress) => {
			return Promise.all(
				ids.map(async (id) => {
					await commands.executeCommand(
						"workbench.extensions.uninstallExtension",
						id,
					);

					progress.report({
						increment,
						message: localize("(info) Extensions.uninstall -> uninstalled", id),
					});
				}),
			);
		},
	);

	return needToReload;
};

export const get = () => {
	return extensions.all
		.filter((ext) => !ext.packageJSON.isBuiltin)
		.map((ext) => ext.id);
};

export const getMissing = (downloadedExtensions: string[]) => {
	const installed = get();
	return downloadedExtensions.filter((ext) => !installed.includes(ext));
};

export const getUnneeded = (downloadedExtensions: string[]) => {
	return get().filter((ext) => !downloadedExtensions.includes(ext));
};
