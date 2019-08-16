import { ISyncService } from "@/models";
import {
  EnvironmentService,
  ExtensionService,
  FileSystemService,
  SettingsService,
  WatcherService,
  WebviewService
} from "@/services";
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
}

export const state: IExtensionState = {};
