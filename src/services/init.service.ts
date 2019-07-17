import { commands } from "vscode";
import { state } from "../models/state.model";
import { EnvironmentService } from "./environment.service";
import { FactoryService } from "./factory.service";
import { FileSystemService } from "./fs.service";
import { SettingsService } from "./settings.service";
import { WatcherService } from "./watcher.service";

export class InitService {
  public static async init() {
    state.env = new EnvironmentService();
    state.fs = new FileSystemService();
    state.settings = new SettingsService();

    const settings = await state.settings.getSettings();

    state.sync = FactoryService.generate(settings.method);

    state.watcher = new WatcherService(
      settings.ignoredItems,
      state.env.locations.userFolder
    );

    if (settings.watchSettings) {
      state.watcher.startWatching();
    }

    this.registerCommands();
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
      )
    );
  }
}
