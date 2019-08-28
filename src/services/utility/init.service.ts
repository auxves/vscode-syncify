import { IVSCodeCommand, state } from "@/models";
import {
  CustomFiles,
  FactoryService,
  Settings,
  WatcherService
} from "@/services";
import { commands, Uri } from "vscode";

export class InitService {
  public static async init() {
    const settings = await Settings.get();

    state.sync = FactoryService.generate(settings.method);

    if (state.watcher) {
      state.watcher.stopWatching();
    }

    state.watcher = new WatcherService(settings.ignoredItems);

    if (settings.watchSettings) {
      state.watcher.startWatching();
    }

    state.context.subscriptions.forEach(disposable => disposable.dispose());

    this.registerCommands();

    if (settings.syncOnStartup) {
      await commands.executeCommand("syncify.sync");
    }
  }

  private static registerCommands() {
    const cmds: IVSCodeCommand = {
      "syncify.sync": () => state.sync.sync(),
      "syncify.upload": () => state.sync.upload(),
      "syncify.download": () => state.sync.download(),
      "syncify.reset": () => Settings.reset(),
      "syncify.openSettings": () => Settings.openSettings(),
      "syncify.otherOptions": () => Settings.showOtherOptions(),
      "syncify.importCustomFile": () => CustomFiles.import(),
      "syncify.registerCustomFile": (uri?: Uri) => CustomFiles.register(uri)
    };

    state.context.subscriptions.push(
      ...Object.entries(cmds).map(([name, fn]) =>
        commands.registerCommand(name, fn)
      )
    );
  }
}
