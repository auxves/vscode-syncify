import { ISyncService } from "@/models";
import { WatcherService } from "@/services";
import { ExtensionContext } from "vscode";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncService;
  watcher?: WatcherService;
}

export const state: IExtensionState = {};
