import { ISyncService } from "models/sync.model";
import { EnvironmentService } from "services/utility/environment.service";
import { ExtensionService } from "services/utility/extension.service";
import { FileSystemService } from "services/utility/fs.service";
import { LocalizationService } from "services/utility/localization.service";
import { SettingsService } from "services/utility/settings.service";
import { WatcherService } from "services/utility/watcher.service";
import { WebviewService } from "services/utility/webview.service";
import { ExtensionContext } from "vscode";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  settings?: SettingsService;
  fs?: FileSystemService;
  env?: EnvironmentService;
  watcher?: WatcherService;
  extensions?: ExtensionService;
  webview?: WebviewService;
  localize: (key: string, ...args: string[]) => string;
}

export const state: IExtensionState = {
  localize: LocalizationService.prototype.localize.bind(
    new LocalizationService()
  )
};
