import { commands } from "vscode";
import { state } from "../state";
import { FactoryService } from "./factory.service";
import { SettingsService } from "./settings.service";

export class InitService {
  public static async init() {
    state.settings = new SettingsService();
    const settings = state.settings.getSettings();
    state.sync = FactoryService.generate(settings.method);
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
        state.sync.reset.bind(state.sync)
      )
    );
  }
}
