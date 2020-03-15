import { window } from "vscode";
import { localize, Webview } from "~/services";
import state from "~/state";

export namespace Logger {
	export async function error(error: Error): Promise<void> {
		console.error(error);

		const result = await window.showErrorMessage(
			localize("(error) default"),
			localize("(label) showDetails")
		);

		if (result) Webview.openErrorPage(error);
	}

	export function debug(...args: any[]): void {
		if (state.isDebugMode) console.log("🐛", ...args);
	}
}
