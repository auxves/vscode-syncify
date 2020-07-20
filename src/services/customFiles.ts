import { Environment, FS, localize, Logger } from "~/services";
import { basename, resolve } from "path";
import { QuickPickItem, Uri, window, workspace } from "vscode";

export namespace CustomFiles {
	export const importFile = async (uri?: Uri): Promise<void> => {
		try {
			const customFilesFolder = await Environment.customFilesFolder;

			await FS.mkdir(customFilesFolder);

			const allFiles = await FS.listFiles(customFilesFolder, ["**/*"]);

			if (allFiles.length === 0) {
				await window.showInformationMessage(
					localize("(info) CustomFiles.import -> noFiles"),
				);
				return;
			}

			const folder = await (async () => {
				if (uri) return uri.fsPath;

				if (!workspace.workspaceFolders) return;

				if (workspace.workspaceFolders.length === 1) {
					return workspace.workspaceFolders[0].uri.fsPath;
				}

				const result = await window.showQuickPick(
					workspace.workspaceFolders.map<QuickPickItem>((f) => ({
						label: f.name,
						description: f.uri.fsPath,
					})),
					{
						placeHolder: localize(
							"(prompt) CustomFiles.import -> folder placeholder",
						),
					},
				);

				if (!result) return;

				const selectedWorkspace = workspace.workspaceFolders.find(
					(f) => f.uri.fsPath === result.description,
				);

				return selectedWorkspace?.uri.fsPath ?? undefined;
			})();

			if (!folder) return;

			const selectedFile = await window.showQuickPick(
				allFiles.map((f) => basename(f)),
				{
					placeHolder: localize(
						"(prompt) CustomFiles.import -> file placeholder",
					),
				},
			);

			if (!selectedFile) return;

			const filepath = resolve(customFilesFolder, selectedFile);

			const filename = await (async () => {
				const newName = await window.showInputBox({
					prompt: localize("(prompt) CustomFiles.import -> file name"),
					value: selectedFile,
				});

				if (newName?.length) return newName;

				return selectedFile;
			})();

			const contents = await FS.readBuffer(filepath);
			await FS.write(resolve(folder, filename), contents);
		} catch (error) {
			Logger.error(error);
		}
	};

	export const registerFile = async (uri?: Uri): Promise<void> => {
		try {
			const customFilesFolder = await Environment.customFilesFolder;

			await FS.mkdir(customFilesFolder);

			const filepath = uri
				? uri.fsPath
				: await (async () => {
						const result = await window.showOpenDialog({
							canSelectMany: false,
							openLabel: localize(
								"(label) CustomFiles.register -> select file",
							),
						});

						if (!result) return;

						return result[0].fsPath;
				  })();

			if (!filepath) return;

			const filename = await (async () => {
				const original = basename(filepath);

				const newName = await window.showInputBox({
					prompt: localize("(prompt) CustomFiles.register -> name"),
					value: original,
				});

				if (newName?.length) return newName;

				return original;
			})();

			const newPath = resolve(customFilesFolder, filename);

			if (await FS.exists(newPath)) {
				const result = await window.showWarningMessage(
					localize("(prompt) CustomFiles.register -> file exists"),
					localize("(label) no"),
					localize("(label) yes"),
				);

				if (result !== localize("(label) yes")) return;
			}

			const contents = await FS.readBuffer(filepath);

			await FS.write(newPath, contents);

			await window.showInformationMessage(
				localize("(info) CustomFiles.register -> registered", filename),
			);
		} catch (error) {
			Logger.error(error);
		}
	};
}
