import { Webview } from "~/services";

export class Logger {
  public static error(error: Error): void {
    console.error(error);
    Webview.openErrorPage(error);
  }
}
