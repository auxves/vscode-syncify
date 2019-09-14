import { window } from "vscode";

export class Logger {
  public static error(
    error: Error,
    message: string,
    showNotification: boolean
  ): void {
    if (error) {
      console.error(error);
    }

    if (showNotification) {
      window.showErrorMessage(message);
    } else {
      window.setStatusBarMessage(message, 5000);
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
