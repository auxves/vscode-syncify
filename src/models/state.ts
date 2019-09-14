import { ExtensionContext } from "vscode";
import { ISyncer } from "~/models";
import { Watcher } from "~/services";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncer;
  watcher?: Watcher;
}

export const state: IExtensionState = {};
