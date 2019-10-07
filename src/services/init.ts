import { commands, Uri } from "vscode";
import { IVSCodeCommands } from "~/models";
import { setSubscriptions } from "~/redux/actions";
import { store } from "~/redux/store";
import { CustomFiles, Factory, Profile, Settings, Watcher } from "~/services";

export class Initializer {
  public static async init() {
    const settings = await Settings.get();

    const syncer = Factory.generate(settings.syncer);

    Watcher.stop();

    Watcher.init(settings.ignoredItems);

    if (settings.watchSettings) Watcher.start();

    store.getState().subscriptions.forEach(d => d.dispose());

    const cmds: IVSCodeCommands = {
      "syncify.sync": () => syncer.sync(),
      "syncify.upload": () => syncer.upload(),
      "syncify.download": () => syncer.download(),
      "syncify.reset": () => Settings.reset(),
      "syncify.openSettings": () => Settings.open(),
      "syncify.reinitialize": () => Initializer.init(),
      "syncify.importCustomFile": (uri?: Uri) => CustomFiles.import(uri),
      "syncify.registerCustomFile": (uri?: Uri) => CustomFiles.register(uri),
      "syncify.switchProfile": () => Profile.switch()
    };

    store.dispatch(
      setSubscriptions(
        Object.entries(cmds).map(([name, fn]) =>
          commands.registerCommand(name, fn)
        )
      )
    );

    if (settings.syncOnStartup) await commands.executeCommand("syncify.sync");
  }
}
