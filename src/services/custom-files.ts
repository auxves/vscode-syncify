import { Environment, FS, localize, Logger } from "~/services";
import { basename, resolve } from "path";
import {
	InputBoxOptions,
	OpenDialogOptions,
	QuickPickItem,
	Uri,
	window,
	workspace,
} from "vscode";

export const importFile = async (uri?: Uri): Promise<void> => {
	try {
		const customFilesFolder = await Environment.customFilesFolder();

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
				workspace.workspaceFolders.map<QuickPickItem>((folder) => ({
					label: folder.name,
					description: folder.uri.fsPath,
				})),
				{
					placeHolder: localize(
						"(prompt) CustomFiles.import -> folder placeholder",
					),
				},
			);

			if (!result) return;

			const selectedWorkspace = workspace.workspaceFolders.find(
				(folder) => folder.uri.fsPath === result.description,
			);

			return selectedWorkspace?.uri.fsPath;
		})();

		if (!folder) return;

		const selectedFile = await window.showQuickPick(
			allFiles.map((file) => basename(file)),
			{
				placeHolder: localize(
					"(prompt) CustomFiles.import -> file placeholder",
				),
			},
		);

		if (!selectedFile) return;

		const filepath = resolve(customFilesFolder, selectedFile);

		const options: InputBoxOptions = {
			prompt: localize("(prompt) CustomFiles.import -> file name"),
			value: selectedFile,
		};

		const filename = (await window.showInputBox(options)) ?? selectedFile;

		if (filename.length === 0) return;

		const contents = await FS.readBuffer(filepath);
		await FS.write(resolve(folder, filename), contents);
	} catch (error) {
		void Logger.error(error);
	}
};

const registerDialogOptions: OpenDialogOptions = {
	canSelectMany: false,
	openLabel: localize("(label) CustomFiles.register -> select file"),
};

export const registerFile = async (uri?: Uri): Promise<void> => {
	try {
		const customFilesFolder = await Environment.customFilesFolder();

		await FS.mkdir(customFilesFolder);

		const filepath =
			uri?.fsPath ??
			(await window.showOpenDialog(registerDialogOptions))?.[0]?.fsPath;

		if (!filepath) return;

		const originalFilename = basename(filepath);

		const options: InputBoxOptions = {
			prompt: localize("(prompt) CustomFiles.register -> name"),
			value: originalFilename,
		};

		const filename = (await window.showInputBox(options)) ?? originalFilename;

		if (filename.length === 0) return;

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
		void Logger.error(error);
	}
};
