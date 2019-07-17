import { ExtensionContext } from "vscode";
import { EnvironmentService } from "../services/environment.service";
import { ExtensionService } from "../services/extension.service";
import { FileSystemService } from "../services/fs.service";
import { LocalizationService } from "../services/localization.service";
import { SettingsService } from "../services/settings.service";
import { WatcherService } from "../services/watcher.service";
import { ISyncService } from "./sync.model";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  settings?: SettingsService;
  fs?: FileSystemService;
  env?: EnvironmentService;
  watcher?: WatcherService;
  extensions?: ExtensionService;
  localize: (key: string, ...args: string[]) => string;
}

export const state: IExtensionState = {
  localize: LocalizationService.prototype.localize.bind(
    new LocalizationService()
  )
};
