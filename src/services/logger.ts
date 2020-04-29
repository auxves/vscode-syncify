import { window } from "vscode";
import { localize, Webview } from "~/services";

export namespace Logger {
	const output = window.createOutputChannel("Syncify");

	export const error = async (error: Error): Promise<void> => {
		output.appendLine(`[error] ${error.message.trim()}`);

		const result = await window.showErrorMessage(
			localize("(error) default"),
			localize("(label) showDetails"),
		);

		if (result) Webview.openErrorPage(error);
	};

	const debugMapper = (value: unknown) => {
		return Array.isArray(value) ? JSON.stringify(value, undefined, 2) : value;
	};

	export const debug = (...args: any[]): void => {
		output.appendLine(
			`[debug] ${args
				.map(a => debugMapper(a))
				.join(" ")
				.trim()}`,
		);
	};
}
