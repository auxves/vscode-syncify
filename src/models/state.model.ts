import { ExtensionContext } from "vscode";
import { ISyncService } from "~/models";
import { WatcherService } from "~/services";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  watcher?: WatcherService;
}

export const state: IExtensionState = {};
