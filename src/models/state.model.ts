import { ExtensionContext } from "vscode";
import { ISyncMethod } from "~/models";
import { Watcher } from "~/services";

export interface IExtensionState {
  context?: ExtensionContext;
  sync?: ISyncMethod;
  watcher?: Watcher;
}

export const state: IExtensionState = {};
