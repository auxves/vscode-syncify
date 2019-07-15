import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { defaultSettings, ISettings } from "../models/settings.model";
import { state } from "../state";

export class SettingsService {
  public getSettings(): ISettings {
    const filepath = resolve(state.context.globalStoragePath, "settings.json");
    if (!existsSync(filepath)) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(readFileSync(filepath, "utf-8"))
    };
  }

  public setSettings(settings: ISettings) {
    if (!existsSync(state.context.globalStoragePath)) {
      mkdirSync(state.context.globalStoragePath);
    }

    const filepath = resolve(state.context.globalStoragePath, "settings.json");

    writeFileSync(filepath, JSON.stringify(settings, null, 2));
  }
}
