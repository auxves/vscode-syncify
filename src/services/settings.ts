import { DeepPartial } from "utility-types";
import { commands, ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings } from "~/models";
import {
  Environment,
  FS,
  Initializer,
  localize,
  Logger,
  Utilities,
  Watcher,
  Webview
} from "~/services";

export class Settings {
  public static async get(): Promise<ISettings> {
    const exists = await FS.exists(Environment.settings);

    if (!exists) {
      await FS.mkdir(Environment.globalStoragePath);
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
      Logger.error(err, "", true);
      return defaultSettings;
    }
  }

  public static async set(settings: DeepPartial<ISettings>): Promise<void> {
    const exists = await FS.exists(Environment.globalStoragePath);
    if (!exists) await FS.mkdir(Environment.globalStoragePath);

    const currentSettings = await Settings.get();

    await FS.write(
      Environment.settings,
      JSON.stringify(Utilities.merge(currentSettings, settings), null, 2)
    );

    await commands.executeCommand("syncify.reinitialize");
  }

  public static async open() {
    return Webview.openSettingsPage(await Settings.get());
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

    if (!userIsSure) return;

    Watcher.stop();

    await FS.delete(Environment.globalStoragePath);

    await Initializer.init();

    window.showInformationMessage(localize("(info) reset.resetComplete"));
  }
}
