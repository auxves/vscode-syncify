import { ExtensionContext } from "vscode";
import { init, initLocalization } from "~/services";
import state from "~/state";

export async function activate(context: ExtensionContext) {
  state.context = context;

  await initLocalization();
  await init();
}
