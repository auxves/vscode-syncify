import { commands, extensions, window } from "vscode";
import { FSWatcher, watch } from "vscode-chokidar";
import { Environment, localize, Settings, Utilities } from "~/services";

export class Watcher {
  public static init(ignoredItems: string[]) {
    if (!this.watcher) {
      this.watcher = watch(Environment.userFolder, {
        ignored: ignoredItems
      });

      extensions.onDidChange(
        () => this.watching && window.state.focused && this.upload()
      );
    }
  }

  public static start() {
    if (!this.watcher) return;

    this.stop();

    this.watching = true;

    this.watcher.addListener(
      "change",
      () => this.watching && window.state.focused && this.upload()
    );
  }

  public static stop() {
    if (this.watcher) this.watcher.removeAllListeners();
    this.watching = false;
  }

  private static watching = false;
  private static watcher: FSWatcher;

  private static async upload() {
    const cmds = await commands.getCommands();

    if (cmds.includes("syncify.cancelUpload")) return;

    const { autoUploadDelay: delay } = await Settings.get();

    let shouldUpload = true;

    const message = window.setStatusBarMessage(
      localize("(info) upload.initiating", delay.toString()),
      5000
    );

    const btn = window.createStatusBarItem(1);

    const disposable = commands.registerCommand("syncify.cancelUpload", () => {
      shouldUpload = false;
      disposable.dispose();
      btn.dispose();
      message.dispose();
    });

    btn.command = "syncify.cancelUpload";
    btn.text = `$(x) ${localize("(command) syncify.cancelUpload")}`;
    btn.show();

    await Utilities.sleep(delay * 1000);

    disposable.dispose();
    btn.dispose();

    if (shouldUpload) commands.executeCommand("syncify.upload");
  }
}
