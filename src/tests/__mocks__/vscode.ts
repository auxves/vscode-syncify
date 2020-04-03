import { resolve } from "path";

export const window = {
	setStatusBarMessage: () => null,
	withProgress: (_: any, fn: any) => fn({ report: () => null }),
	showInformationMessage: () => null,
	showWarningMessage: () => null,
	showErrorMessage: () => null,
	showInputBox: () => null
};

export const extensions = {
	all: [
		{
			id: "arnohovhannisyan.syncify",
			packageJSON: { isBuiltin: false }
		}
	],
	getExtension: () => ({
		extensionPath: resolve("."),
		packageJSON: {
			version: ""
		}
	}),
	onDidChange: () => null
};

export const commands = {
	registerCommand: () => ({ dispose: () => null }),
	executeCommand: () => null,
	getCommands: () => []
};

export enum ProgressLocation {
	Notification = 1
}

export const Uri = {
	file: () => "file:///"
};
