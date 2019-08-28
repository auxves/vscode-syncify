import { state } from "@/models";
import {
  CustomFileService,
  EnvironmentService,
  FactoryService,
  SettingsService,
  WatcherService
} from "@/services";
import { commands } from "vscode";

export class InitService {
  public static async init() {
    const settings = await SettingsService.getSettings();

    state.sync = FactoryService.generate(settings.method);

    if (state.watcher) {
      state.watcher.stopWatching();
    }

    state.watcher = new WatcherService(
      settings.ignoredItems,
      EnvironmentService.userFolder
    );

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
        SettingsService.resetSettings.bind(SettingsService)
      ),
      commands.registerCommand(
        "syncify.openSettings",
        SettingsService.openSettings.bind(SettingsService)
      ),
      commands.registerCommand(
        "syncify.otherOptions",
        SettingsService.showOtherOptions.bind(SettingsService)
      ),
      commands.registerCommand(
        "syncify.importCustomFile",
        CustomFileService.import
      ),
      commands.registerCommand(
        "syncify.registerCustomFile",
        CustomFileService.register
      )
    );
  }
}
