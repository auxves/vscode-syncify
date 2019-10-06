import { Disposable } from "vscode";

export enum ActionTypes {
  setExtensionPath = "SET -> EXTENSION PATH",
  setGlobalStoragePath = "SET -> GLOBAL STORAGE PATH",
  setSubscriptions = "SET -> SUBSCRIPTIONS"
}

export interface IActions<P = any> {
  data: P;
  type: ActionTypes;
}

type ActionWithData<P> = (data: P) => IActions<P>;

export const setExtensionPath: ActionWithData<string> = data => ({
  data,
  type: ActionTypes.setExtensionPath
});

export const setGlobalStoragePath: ActionWithData<string> = data => ({
  data,
  type: ActionTypes.setGlobalStoragePath
});

export const setSubscriptions: ActionWithData<Disposable[]> = data => ({
  data,
  type: ActionTypes.setSubscriptions
});

export default {
  setExtensionPath,
  setGlobalStoragePath,
  setSubscriptions
};
