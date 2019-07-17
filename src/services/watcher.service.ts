import { commands, extensions, window } from "vscode";
import { watch } from "vscode-chokidar";
import { state } from "../models/state.model";
import { UtilityService } from "./utility.service";

export class WatcherService {
  private watching = false;
  private watcher = watch(this.userFolder, {
    ignored: this.ignoredItems
  });

  constructor(private ignoredItems: string[], private userFolder: string) {
    extensions.onDidChange(async () => {
      if (this.watching && window.state.focused) {
        await this.upload();
      }
    });
  }

  public async startWatching() {
    this.stopWatching();

    this.watching = true;

    this.watcher.addListener("change", async (path: string) => {
      if (this.watching && window.state.focused) {
        this.upload();
      }
    });
  }

  public stopWatching() {
    if (this.watcher) {
      this.watcher.removeAllListeners();
    }
    this.watching = false;
  }

  private async upload() {
    const settings = await state.settings.getSettings();

    window.setStatusBarMessage("").dispose();
    window.setStatusBarMessage(
      state
        .localize("info(upload).initiating")
        .replace("{0}", settings.autoUploadDelay.toString()),
      5000
    );

    await UtilityService.sleep(settings.autoUploadDelay * 1000);

    commands.executeCommand("syncify.upload");
  }
}
