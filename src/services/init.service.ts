import { commands } from "vscode";
import { state } from "../models/state.model";
import { EnvironmentService } from "./environment.service";
import { ExtensionService } from "./extension.service";
import { FactoryService } from "./factory.service";
import { FileSystemService } from "./fs.service";
import { SettingsService } from "./settings.service";
import { WatcherService } from "./watcher.service";
import { WebviewService } from "./webview.service";

export class InitService {
  public static async init() {
    state.env = new EnvironmentService();
    state.fs = new FileSystemService();
    state.settings = new SettingsService();

    const settings = await state.settings.getSettings();

    state.sync = FactoryService.generate(settings.method);

    if (state.watcher) {
      state.watcher.stopWatching();
    }

    state.watcher = new WatcherService(
      settings.ignoredItems,
      state.env.locations.userFolder
    );

    state.extensions = new ExtensionService();
    state.webview = new WebviewService();

    if (settings.watchSettings) {
      state.watcher.startWatching();
    }

    if (state.context.subscriptions.length) {
      state.context.subscriptions.forEach(disposable => disposable.dispose());
    }

    this.registerCommands();

    if (settings.syncOnStartup) {
      await commands.executeCommand("syncify.sync");
    }
  }

  private static registerCommands() {
    state.context.subscriptions.push(
      commands.registerCommand(
        "syncify.sync",
        state.sync.sync.bind(state.sync)
      ),
      commands.registerCommand(
        "syncify.upload",
        state.sync.upload.bind(state.sync)
      ),
      commands.registerCommand(
        "syncify.download",
        state.sync.download.bind(state.sync)
      ),
      commands.registerCommand(
        "syncify.reset",
        state.settings.resetSettings.bind(state.settings)
      ),
      commands.registerCommand(
        "syncify.openSettings",
        state.settings.openSettings.bind(state.settings)
      ),
      commands.registerCommand(
        "syncify.otherOptions",
        state.settings.showOtherOptions.bind(state.settings)
      )
    );
  }
}
