import { ExtensionContext } from "vscode";
import { Initializer, initLocalization } from "~/services";
import state from "~/state";

export async function activate(context: ExtensionContext) {
  state.context = context;

  await initLocalization();
  await Initializer.init();
}
