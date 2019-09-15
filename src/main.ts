import { ExtensionContext } from "vscode";
import { state } from "~/models";
import { Initializer } from "~/services";

export async function activate(context: ExtensionContext) {
  state.context = context;

  await Initializer.init();
}
