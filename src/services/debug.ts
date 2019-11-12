import { commands } from "vscode";
import actions from "~/redux/actions";
import { store } from "~/redux/store";

export class Debug {
  public static log(...args: any[]) {
    const { isDebugMode } = store.getState();

    if (isDebugMode) console.log(...args);
  }

  public static setDebug(value: boolean) {
    if (value) {
      store.dispatch(actions.enableDebugMode());
    } else {
      store.dispatch(actions.disableDebugMode());
    }

    return commands.executeCommand("syncify.reinitialize");
  }
}
