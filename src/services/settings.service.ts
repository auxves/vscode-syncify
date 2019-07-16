import { merge } from "lodash";
import { resolve } from "path";
import { ViewColumn, window, workspace } from "vscode";
import { defaultSettings, ISettings } from "../models/settings.model";
import { state } from "../state";

export class SettingsService {
  public async getSettings(): Promise<ISettings> {
    const filepath = resolve(state.context.globalStoragePath, "settings.json");
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

    const filepath = resolve(state.context.globalStoragePath, "settings.json");

    state.fs.write(
      filepath,
      JSON.stringify(merge(defaultSettings, settings), null, 2)
    );
  }

  public async openSettings() {
    const filepath = resolve(state.context.globalStoragePath, "settings.json");
    const document = await workspace.openTextDocument(filepath);
    await window.showTextDocument(document, ViewColumn.One, true);
  }

  public async resetSettings(): Promise<void> {
    this.setSettings(defaultSettings);
    await state.sync.reset();
  }
}
