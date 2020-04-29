import { window } from "vscode";
import { localize, Webview } from "~/services";

export namespace Logger {
	const output = window.createOutputChannel("Syncify");

	export const error = (err: Error): void => {
		output.appendLine(`[error] ${err.message.trim()}`);

		window
			.showErrorMessage(
				localize("(error) default"),
				localize("(label) showDetails"),
			)
			.then((result) => result && Webview.openErrorPage(err), error);
	};

	const debugMapper = (value: unknown) => {
		return Array.isArray(value) ? JSON.stringify(value, undefined, 2) : value;
	};

	export const debug = (...args: any[]): void => {
		output.appendLine(
			`[debug] ${args
				.map((a) => debugMapper(a))
				.join(" ")
				.trim()}`,
		);
	};
}
