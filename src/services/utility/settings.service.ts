import { defaultSettings, ISettings, state } from "@/models";
import { InitService, localize } from "@/services";
import merge from "lodash/merge";
import { ViewColumn, window, workspace } from "vscode";

export class SettingsService {
  public async getSettings(): Promise<ISettings> {
    const filepath = state.env.locations.settings;
    const exists = await state.fs.exists(filepath);
    if (!exists) {
      await this.setSettings(defaultSettings);
      return defaultSettings;
    }

    try {
      const settings = JSON.parse(await state.fs.read(filepath));
      const newSettings: ISettings = merge(defaultSettings, settings);

      if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
        await this.setSettings(settings);
      }

      return newSettings;
    } catch (err) {
      throw new Error(err);
    }
  }

  public async setSettings(settings: ISettings): Promise<void> {
    const exists = await state.fs.exists(state.context.globalStoragePath);
    if (!exists) {
      await state.fs.mkdir(state.context.globalStoragePath);
    }

    const filepath = state.env.locations.settings;

    await state.fs.write(
      filepath,
      JSON.stringify(merge(defaultSettings, settings), null, 2)
    );

    await InitService.init();
  }

  public async setPartialSettings(settings: Partial<ISettings>): Promise<void> {
    const currentSettings = await this.getSettings();
    await this.setSettings(merge(currentSettings, settings));
  }

  public async openSettings() {
    state.webview.openSettingsPage(await this.getSettings());
  }

  public async openSettingsFile() {
    const filepath = state.env.locations.settings;
    await window.showTextDocument(
      await workspace.openTextDocument(filepath),
      ViewColumn.One,
      true
    );
  }

  public async resetSettings(): Promise<void> {
    state.watcher.stopWatching();

    await state.fs.delete(state.context.globalStoragePath);

    await state.sync.reset();

    if (defaultSettings.watchSettings) {
      state.watcher.startWatching();
    }

    window.showInformationMessage(localize("(info) reset.resetComplete"));
  }

  public async showOtherOptions(name?: string): Promise<void> {
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

  private async switchProfile(): Promise<void> {
    const settings = await state.settings.getSettings();
    const mappedProfiles = settings.repo.profiles.map(
      prof => `${prof.name} [branch: ${prof.branch}]`
    );
    const selectedProfile = await window.showQuickPick(mappedProfiles);
    if (selectedProfile) {
      const newProfile = settings.repo.profiles.filter(
        prof => `${prof.name} (${prof.branch})` === selectedProfile
      )[0];
      await state.settings.setPartialSettings({
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
