import { ExtensionContext } from "vscode";
import { FileSystemService } from "../services/fs.service";
import { SettingsService } from "../services/settings.service";
import { ISyncService } from "./sync.model";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  settings?: SettingsService;
  fs?: FileSystemService;
}
