import { defaultSettings, ISettings, state } from "@/models";
import {
  EnvironmentService,
  InitService,
  localize,
  WebviewService
} from "@/services";
import { FS } from "@/services/utility/fs.service";
import merge from "lodash/merge";
import { ViewColumn, window, workspace } from "vscode";

export class SettingsService {
  public static async getSettings(): Promise<ISettings> {
    const filepath = EnvironmentService.settings;
    const exists = await FS.exists(filepath);
    if (!exists) {
      await this.setSettings(defaultSettings);
      return defaultSettings;
    }

    try {
      const settings = JSON.parse(await FS.read(filepath));
      const newSettings: ISettings = merge(defaultSettings, settings);

      if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
        await this.setSettings(settings);
      }

      return newSettings;
    } catch (err) {
      throw new Error(err);
    }
  }

  public static async setSettings(settings: ISettings): Promise<void> {
    const exists = await FS.exists(state.context.globalStoragePath);
    if (!exists) {
      await FS.mkdir(state.context.globalStoragePath);
    }

    const filepath = EnvironmentService.settings;

    await FS.write(
      filepath,
      JSON.stringify(merge(defaultSettings, settings), null, 2)
    );

    await InitService.init();
  }

  public static async setPartialSettings(
    settings: Partial<ISettings>
  ): Promise<void> {
    const currentSettings = await this.getSettings();
    await this.setSettings(merge(currentSettings, settings));
  }

  public static async openSettings() {
    WebviewService.openSettingsPage(await this.getSettings());
  }

  public static async openSettingsFile() {
    const filepath = EnvironmentService.settings;
    await window.showTextDocument(
      await workspace.openTextDocument(filepath),
      ViewColumn.One,
      true
    );
  }

  public static async resetSettings(): Promise<void> {
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
        action: InitService.init
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
    const settings = await SettingsService.getSettings();
    const mappedProfiles = settings.repo.profiles.map(
      prof => `${prof.name} [branch: ${prof.branch}]`
    );
    const selectedProfile = await window.showQuickPick(mappedProfiles);
    if (selectedProfile) {
      const newProfile = settings.repo.profiles.filter(
        prof => `${prof.name} (${prof.branch})` === selectedProfile
      )[0];
      await SettingsService.setPartialSettings({
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
