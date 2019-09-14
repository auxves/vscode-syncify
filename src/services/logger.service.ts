import { window } from "vscode";

export class Logger {
  public static error(
    error: any,
    message: string,
    showMessageBox: boolean
  ): void {
    if (error) {
      console.error(new Error(error));
    }

    if (showMessageBox) {
      window.showErrorMessage(message);
      window.setStatusBarMessage("").dispose();
    } else {
      window.setStatusBarMessage(message, 5000);
    }
  }
}
