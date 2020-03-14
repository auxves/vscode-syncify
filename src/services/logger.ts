import { window } from "vscode";
import { localize, Webview } from "~/services";
import state from "~/state";

export namespace Logger {
	export function error(error: Error): void {
		console.error(error);

		window
			.showErrorMessage(
				localize("(error) default"),
				localize("(label) showDetails")
			)
			.then(result => {
				if (result) Webview.openErrorPage(error);
			});
	}

	export function debug(...args: any[]): void {
		if (state.isDebugMode) console.log("🐛", ...args);
	}
}
