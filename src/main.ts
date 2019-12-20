import { ExtensionContext } from "vscode";
import actions from "~/redux/actions";
import { store } from "~/redux/store";
import { Initializer, initLocalization } from "~/services";

export async function activate(context: ExtensionContext) {
  store.dispatch(actions.setGlobalStoragePath(context.globalStoragePath));
  store.dispatch(actions.setExtensionPath(context.extensionPath));

  await initLocalization();
  await Initializer.init();
}

export function deactivate() {
  store.getState().subscriptions.forEach(s => s.dispose());
  store.dispatch(actions.setSubscriptions([]));
}
