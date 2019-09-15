import merge from "lodash/merge";
import { ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings, PartialSettings, state } from "~/models";
import {
  Environment,
  FS,
  Initializer,
  localize,
  Logger,
  Webview
} from "~/services";

export class Settings {
  public static async get(): Promise<ISettings> {
    const filepath = Environment.settings;
    const exists = await FS.exists(filepath);
    if (!exists) {
      await this.set(defaultSettings);
      return defaultSettings;
    }

    try {
      const settings = JSON.parse(await FS.read(filepath));
      const newSettings: ISettings = merge(defaultSettings, settings);

      if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
        await this.set(settings);
      }

      return newSettings;
    } catch (err) {
      Logger.error(err, null, true);
      return;
    }
  }

  public static async set(settings: PartialSettings): Promise<void> {
    const exists = await FS.exists(state.context.globalStoragePath);
    if (!exists) {
      await FS.mkdir(state.context.globalStoragePath);
    }

    const currentSettings = await this.get();

    await FS.write(
      Environment.settings,
      JSON.stringify(merge(currentSettings, settings), null, 2)
    );

    await Initializer.init();
  }

  public static async openSettings() {
    Webview.openSettingsPage(await this.get());
  }

  public static async openSettingsFile() {
    const filepath = Environment.settings;
    await window.showTextDocument(
      await workspace.openTextDocument(filepath),
      ViewColumn.One,
      true
    );
  }

  public static async reset(): Promise<void> {
    state.watcher.stopWatching();

    await FS.delete(state.context.globalStoragePath);

    await state.sync.reset();

    if (defaultSettings.watchSettings) {
      state.watcher.startWatching();
    }

    window.showInformationMessage(localize("(info) reset.resetComplete"));
  }

  public static async switchProfile(): Promise<void> {
    const { repo } = await Settings.get();

    const mappedProfiles = repo.profiles.map(
      prof => `${prof.name} [branch: ${prof.branch}]`
    );

    const selectedProfile = await window.showQuickPick(mappedProfiles);

    if (!selectedProfile) {
      return;
    }

    const newProfile = repo.profiles.filter(
      prof => `${prof.name} [branch: ${prof.branch}]` === selectedProfile
    )[0];

    await Settings.set({
      repo: {
        currentProfile: (newProfile || repo.profiles[0]).name
      }
    });

    await window.showInformationMessage(
      localize("(info) repo.switchedProfile", newProfile.name)
    );
  }
}
