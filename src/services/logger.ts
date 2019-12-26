import { Webview } from "~/services";
import state from "~/state";

export class Logger {
  public static error(error: Error): void {
    console.error(error);
    Webview.openErrorPage(error);
  }

  public static debug(...args: any[]): void {
    if (state.isDebugMode) console.log("🐛", ...args);
  }
}
