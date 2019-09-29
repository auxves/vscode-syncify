import { commands, ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings, PartialSettings, state } from "~/models";
import {
  Environment,
  FS,
  Initializer,
  localize,
  Logger,
  Utilities,
  Webview
} from "~/services";
import { store } from "~/store";

export class Settings {
  public static async get(): Promise<ISettings> {
    const exists = await FS.exists(Environment.settings);

    if (!exists) {
      await FS.mkdir(store.getState().globalStoragePath);
      await FS.write(
        Environment.settings,
        JSON.stringify(defaultSettings, null, 2)
      );
      return defaultSettings;
    }

    try {
      const contents = await FS.read(Environment.settings);
      const settings = JSON.parse(contents);

      return Utilities.merge(defaultSettings, settings);
    } catch (err) {
      Logger.error(err, null, true);
      return;
    }
  }

  public static async set(settings: PartialSettings): Promise<void> {
    const globalStoragePath = store.getState().globalStoragePath;

    const exists = await FS.exists(globalStoragePath);
    if (!exists) {
      await FS.mkdir(globalStoragePath);
    }

    const currentSettings = await Settings.get();

    await FS.write(
      Environment.settings,
      JSON.stringify(Utilities.merge(currentSettings, settings), null, 2)
    );

    await commands.executeCommand("syncify.reinitialize");
  }

  public static async open() {
    await Webview.openSettingsPage(await Settings.get());
  }

  public static async openFile() {
    await window.showTextDocument(
      await workspace.openTextDocument(Environment.settings),
      ViewColumn.One,
      true
    );
  }

  public static async reset(): Promise<void> {
    const userIsSure = await Utilities.confirm("reset");

    if (!userIsSure) {
      return;
    }

    state.watcher.stopWatching();

    await FS.delete(store.getState().globalStoragePath);

    await state.sync.reset();

    await Initializer.init();

    window.showInformationMessage(localize("(info) reset.resetComplete"));
  }
}
