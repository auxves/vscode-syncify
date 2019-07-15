import { ExtensionContext } from "vscode";
import { SettingsService } from "../services/settings.service";
import { ISyncService } from "./sync.model";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  settings?: SettingsService;
}
