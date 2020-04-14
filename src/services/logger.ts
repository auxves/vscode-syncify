import { window } from "vscode";
import { localize, Webview } from "~/services";
import state from "~/state";

export namespace Logger {
	const css = (color: string) => `
		background-color: ${color};
		color: white;
		font-size: 80%;
		padding: 0.15rem 0.3rem;
		border-radius: 0.2rem;
	`;

	const errorCss = css("crimson");

	export async function error(error: Error): Promise<void> {
		console.error("%cSyncify:", errorCss, error.message);

		const result = await window.showErrorMessage(
			localize("(error) default"),
			localize("(label) showDetails")
		);

		if (result) Webview.openErrorPage(error);
	}

	const debugCss = css("teal");

	export function debug(...args: any[]): void {
		if (state.isDebugMode) console.log("%cSyncify:", debugCss, ...args);
	}
}
