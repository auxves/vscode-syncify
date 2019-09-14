import merge from "lodash/merge";
import { ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings, state } from "~/models";
import { Environment, FS, Initializer, localize, Webview } from "~/services";

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
      throw new Error(err);
    }
  }

  public static async set(settings: ISettings): Promise<void> {
    const exists = await FS.exists(state.context.globalStoragePath);
    if (!exists) {
      await FS.mkdir(state.context.globalStoragePath);
    }

    const filepath = Environment.settings;

    await FS.write(
      filepath,
      JSON.stringify(merge(defaultSettings, settings), null, 2)
    );

    await Initializer.init();
  }

  public static async setPartial(settings: Partial<ISettings>): Promise<void> {
    const currentSettings = await this.get();
    await this.set(merge(currentSettings, settings));
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

  public static async showOtherOptions(name?: string): Promise<void> {
    const options = [
      {
        name: localize("(option) switchProfile.name"),
        action: this.switchProfile
      },
      {
        name: localize("(option) reinitialize.name"),
        action: Initializer.init
      }
    ];

    const selection =
      name || (await window.showQuickPick(options.map(opt => opt.name)));

    if (selection) {
      const selectedOption = options.filter(opt => opt.name === selection)[0];
      await selectedOption.action();
    }
  }

  private static async switchProfile(): Promise<void> {
    const settings = await Settings.get();
    const mappedProfiles = settings.repo.profiles.map(
      prof => `${prof.name} [branch: ${prof.branch}]`
    );
    const selectedProfile = await window.showQuickPick(mappedProfiles);
    if (selectedProfile) {
      const newProfile = settings.repo.profiles.filter(
        prof => `${prof.name} (${prof.branch})` === selectedProfile
      )[0];
      await Settings.setPartial({
        repo: {
          ...settings.repo,
          currentProfile: newProfile.name
        }
      });
      await window.showInformationMessage(
        localize("(info) repo.switchedProfile", newProfile.name)
      );
    }
  }
}
