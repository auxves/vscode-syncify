import { window } from "vscode";
import { localize, Webview } from "~/services";
import state from "~/state";

export class Logger {
  public static error(error: Error): void {
    console.error(error);

    window
      .showErrorMessage(
        localize("(error) default"),
        localize("(label) showDetails")
      )
      .then(res => {
        if (res) Webview.openErrorPage(error);
      });
  }

  public static debug(...args: any[]): void {
    if (state.isDebugMode) console.log("🐛", ...args);
  }
}
