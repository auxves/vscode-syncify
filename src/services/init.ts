import { commands, Uri } from "vscode";
import { IVSCodeCommands, state } from "~/models";
import { CustomFiles, Factory, Settings, Watcher } from "~/services";

export class Initializer {
  public static async init() {
    const settings = await Settings.get();

    state.sync = Factory.generate(settings.syncer);

    if (state.watcher) {
      state.watcher.stopWatching();
    }

    state.watcher = new Watcher(settings.ignoredItems);

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
    const cmds: IVSCodeCommands = {
      "syncify.sync": () => state.sync.sync(),
      "syncify.upload": () => state.sync.upload(),
      "syncify.download": () => state.sync.download(),
      "syncify.reset": () => Settings.reset(),
      "syncify.openSettings": () => Settings.openSettings(),
      "syncify.otherOptions": () => Settings.showOtherOptions(),
      "syncify.importCustomFile": (uri?: Uri) => CustomFiles.import(uri),
      "syncify.registerCustomFile": (uri?: Uri) => CustomFiles.register(uri)
    };

    state.context.subscriptions.push(
      ...Object.entries(cmds).map(([name, fn]) =>
        commands.registerCommand(name, fn)
      )
    );
  }
}