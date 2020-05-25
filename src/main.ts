import { ExtensionContext } from "vscode";
import { init, initLocalization, migrate } from "~/services";
import state from "~/state";
import migrations from "~/migrations";

export async function activate(context: ExtensionContext): Promise<void> {
	state.context = context;

	await initLocalization();

	await migrate(migrations);

	await init();
}
