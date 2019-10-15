import { Webview } from "~/services/webview";

export class Logger {
  public static error(error: Error): void {
    console.error(error);
    Webview.openErrorPage(error);
  }
}
