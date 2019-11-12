import { relative } from "path";
import { commands, Disposable, extensions, window } from "vscode";
import chokidar, { FSWatcher } from "vscode-chokidar";
import { Debug, Environment, localize, Settings } from "~/services";
import { sleep } from "~/utilities";

export class Watcher {
  public static init(ignoredItems: string[]) {
    if (!this.watcher) {
      this.watcher = chokidar.watch([], {
        ignored: ignoredItems
      });
    }
  }

  public static start() {
    if (!this.watcher) return;

    this.stop();

    this.watcher.add(Environment.userFolder);
    this.watcher.on("change", path => {
      Debug.log(`File change: ${relative(Environment.userFolder, path)}`);

      return this.upload();
    });

    this.disposable = extensions.onDidChange(() => {
      Debug.log("Extension installed/uninstalled");

      return this.upload();
    });
  }

  public static stop() {
    if (this.watcher) this.watcher.close();

    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = undefined;
    }
  }

  private static disposable?: Disposable = undefined;
  private static watcher?: FSWatcher = undefined;

  private static async upload() {
    if (!window.state.focused) return;

    const cmds = await commands.getCommands();

    if (cmds.includes("syncify.cancelUpload")) return;

    const delay = await Settings.get(s => s.autoUploadDelay);

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

    await sleep(delay * 1000);

    disposable.dispose();
    btn.dispose();

    if (shouldUpload) commands.executeCommand("syncify.upload");
  }
}
