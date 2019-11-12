import { DeepPartial } from "utility-types";
import { commands, ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings } from "~/models";
import {
  Environment,
  FS,
  Initializer,
  localize,
  Logger,
  Watcher,
  Webview
} from "~/services";
import { confirm, merge } from "~/utilities";

export class Settings {
  public static async get<T = ISettings>(
    selector?: (s: ISettings) => T
  ): Promise<T> {
    const exists = await FS.exists(Environment.settings);

    if (!exists) {
      await FS.mkdir(Environment.globalStoragePath);
      await FS.write(
        Environment.settings,
        JSON.stringify(defaultSettings, null, 2)
      );

      if (selector) return selector(defaultSettings);

      return defaultSettings as any;
    }

    try {
      const contents = await FS.read(Environment.settings);
      const settings = JSON.parse(contents);

      const merged = merge(defaultSettings, settings);

      if (selector) return selector(merged);

      return merged;
    } catch (err) {
      Logger.error(err);

      if (selector) return selector(defaultSettings);

      return defaultSettings as any;
    }
  }

  public static async set(settings: DeepPartial<ISettings>): Promise<void> {
    const exists = await FS.exists(Environment.globalStoragePath);
    if (!exists) await FS.mkdir(Environment.globalStoragePath);

    const currentSettings = await Settings.get();

    await FS.write(
      Environment.settings,
      JSON.stringify(merge(currentSettings, settings), null, 2)
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
    const userIsSure = await confirm("reset");

    if (!userIsSure) return;

    Watcher.stop();

    await FS.delete(Environment.globalStoragePath);

    await Initializer.init();

    window.showInformationMessage(localize("(info) reset.resetComplete"));
  }
}
