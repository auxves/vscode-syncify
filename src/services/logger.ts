import { window } from "vscode";
import { localize } from "~/services";

export class Logger {
  public static error(
    error: Error | null,
    message: string,
    showNotification: boolean
  ): void {
    if (error) console.error(error);

    if (showNotification) {
      window.showErrorMessage(message || localize("(error) checkConsole"));
    } else {
      window.setStatusBarMessage(
        message || localize("(error) checkConsole"),
        5000
      );
    }
  }

  public static info(message: string, showNotification: boolean): void {
    if (showNotification) {
      window.showInformationMessage(message);
    } else {
      window.setStatusBarMessage(message, 5000);
    }
  }
}
