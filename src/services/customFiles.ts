import { basename, resolve } from "path";
import { QuickPickItem, Uri, window, workspace } from "vscode";
import { Environment, FS, localize, Logger } from "~/services";

export namespace CustomFiles {
	export async function importFile(uri?: Uri): Promise<void> {
		try {
			const folderExists = await FS.exists(Environment.customFilesFolder);

			if (!folderExists) {
				await FS.mkdir(Environment.customFilesFolder);
			}

			const allFiles = await FS.listFiles(Environment.customFilesFolder);

			if (allFiles.length === 0) {
				await window.showInformationMessage(
					localize("(info) customFiles -> noFilesAvailable")
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
					workspace.workspaceFolders.map<QuickPickItem>(f => ({
						label: f.name,
						description: f.uri.fsPath
					})),
					{
						placeHolder: localize(
							"(prompt) customFiles -> import -> folder -> placeholder"
						)
					}
				);

				const selectedWorkspace = workspace.workspaceFolders.find(
					f => f.uri.fsPath === result?.description
				);

				if (!selectedWorkspace) return;

				return selectedWorkspace.uri.fsPath;
			})();

			if (!folder) return;

			const selectedFile = await window.showQuickPick(
				allFiles.map(f => basename(f)),
				{
					placeHolder: localize(
						"(prompt) customFiles -> import -> file -> placeholder"
					)
				}
			);

			if (!selectedFile) return;

			const filepath = resolve(Environment.customFilesFolder, selectedFile);

			const filename = await (async () => {
				const newName = await window.showInputBox({
					prompt: localize("(prompt) customFiles -> import -> file -> name"),
					value: selectedFile
				});

				if (newName?.length) return newName;

				return selectedFile;
			})();

			const contents = await FS.read(filepath, true);
			await FS.write(resolve(folder, filename), contents);
		} catch (error) {
			Logger.error(error);
		}
	}

	export async function registerFile(uri?: Uri) {
		try {
			const folderExists = await FS.exists(Environment.customFilesFolder);

			if (!folderExists) {
				await FS.mkdir(Environment.customFilesFolder);
			}

			const filepath = uri
				? uri.fsPath
				: await (async () => {
						const result = await window.showOpenDialog({
							canSelectMany: false,
							openLabel: localize("(label) customFiles -> selectFile")
						});

						if (!result) return;

						return result[0].fsPath;
				  })();

			if (!filepath) return;

			const filename = await (async () => {
				const original = basename(filepath);

				const newName = await window.showInputBox({
					prompt: localize("(prompt) customFiles -> register -> name"),
					value: original
				});

				if (newName?.length) return newName;

				return original;
			})();

			const newPath = resolve(Environment.customFilesFolder, filename);

			if (await FS.exists(newPath)) {
				const res = await window.showWarningMessage(
					localize("(prompt) customFiles -> register -> exists"),
					localize("(label) no"),
					localize("(label) yes")
				);

				if (res !== localize("(label) yes")) return;
			}

			const contents = await FS.read(filepath, true);

			await FS.write(newPath, contents);

			await window.showInformationMessage(
				localize("(info) customFiles -> registered", filename)
			);
		} catch (error) {
			Logger.error(error);
		}
	}
}
