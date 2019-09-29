import { ExtensionContext } from "vscode";
import { Initializer } from "~/services";
import { actions, store } from "~/store";

export async function activate(context: ExtensionContext) {
  store.dispatch(actions.setGlobalStoragePath(context.globalStoragePath));
  store.dispatch(actions.setExtensionPath(context.extensionPath));

  await Initializer.init();
}

export function deactivate() {
  store.getState().subscriptions.forEach(s => s.dispose());
  store.dispatch(actions.setSubscriptions([]));
}
