import { resolve } from "path";

export const window = {
	createOutputChannel: () => ({ appendLine: () => undefined }),
	setStatusBarMessage: () => undefined,
	withProgress: (_: any, fn: any) => fn({ report: () => undefined }),
	showInformationMessage: () => undefined,
	showWarningMessage: () => undefined,
	showErrorMessage: () => undefined,
	showInputBox: () => undefined,
};

export const extensions = {
	all: [
		{
			id: "arnohovhannisyan.syncify",
			packageJSON: { isBuiltin: false },
		},
	],
	getExtension: () => ({
		extensionPath: resolve(),
		packageJSON: {
			version: "",
		},
	}),
	onDidChange: () => undefined,
};

export const commands = {
	registerCommand: () => ({ dispose: () => undefined }),
	executeCommand: () => undefined,
	getCommands: () => [],
};

export enum ProgressLocation {
	Notification = 1,
}

export const Uri = {
	file: () => "file:///",
};
