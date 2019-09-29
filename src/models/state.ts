import { ISyncer } from "~/models";
import { Watcher } from "~/services";

export interface IExtensionState {
  sync?: ISyncer;
  watcher?: Watcher;
}

export const state: IExtensionState = {};
