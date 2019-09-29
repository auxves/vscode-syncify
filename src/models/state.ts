import { Watcher } from "~/services";

export interface IExtensionState {
  watcher?: Watcher;
}

export const state: IExtensionState = {};
