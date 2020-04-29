import { window } from "vscode";
import { localize } from "~/services";

export async function confirm(id: string): Promise<boolean> {
	const response = await window.showWarningMessage(
		localize(`(confirm) ${id}`),
		localize("(label) yes"),
		localize("(label) no"),
	);

	return response === localize("(label) yes");
}
