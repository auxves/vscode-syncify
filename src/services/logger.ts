import { window } from "vscode";
import { localize, Webview } from "~/services";

export namespace Logger {
	const output = window.createOutputChannel("Syncify");

	export async function error(error: Error): Promise<void> {
		output.appendLine(`[error] ${error.message.trim()}`);

		const result = await window.showErrorMessage(
			localize("(error) default"),
			localize("(label) showDetails")
		);

		if (result) Webview.openErrorPage(error);
	}

	const debugMapper = (value: unknown) => {
		return Array.isArray(value) ? JSON.stringify(value, null, 2) : value;
	};

	export function debug(...args: any[]): void {
		output.appendLine(`[debug] ${args.map(debugMapper).join(" ").trim()}`);
	}
}
