import { commands, ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings, PartialSettings, state } from "~/models";
import {
  Environment,
  FS,
  localize,
  Logger,
  Utilities,
  Webview
} from "~/services";

export class Settings {
  public static async get(): Promise<ISettings> {
    const exists = await FS.exists(Environment.settings);

    if (!exists) {
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
    const exists = await FS.exists(state.context.globalStoragePath);
    if (!exists) {
      await FS.mkdir(state.context.globalStoragePath);
    }

    const currentSettings = await this.get();

    await FS.write(
      Environment.settings,
      JSON.stringify(Utilities.merge(currentSettings, settings), null, 2)
    );

    await commands.executeCommand("syncify.reinitialize");
  }

  public static async openSettings() {
    await Webview.openSettingsPage(await this.get());
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
