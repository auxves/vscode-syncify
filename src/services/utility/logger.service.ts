import { window } from "vscode";

export class LoggerService {
  public static logException(
    error: any,
    message: string,
    showMessageBox: boolean
  ): void {
    if (error) {
      console.error(error);
    }

    if (showMessageBox) {
      window.showErrorMessage(message);
      window.setStatusBarMessage("").dispose();
    } else {
      window.setStatusBarMessage(message, 5000);
    }
  }
}
