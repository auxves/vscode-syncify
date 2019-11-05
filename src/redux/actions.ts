import { Disposable } from "vscode";

export enum ActionTypes {
  setExtensionPath = "Set Extension Path",
  setGlobalStoragePath = "Set Global Storage Path",
  setSubscriptions = "Set Subscriptions",
  enableDebugMode = "Enable Debug Mode",
  disableDebugMode = "Disable Debug Mode"
}

export interface IActions<P = any> {
  data: P;
  type: ActionTypes;
}

type ActionWithData<P> = (data: P) => IActions<P>;
type ActionWithoutData = () => IActions<null>;

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

export const enableDebugMode: ActionWithoutData = () => ({
  data: null,
  type: ActionTypes.enableDebugMode
});

export const disableDebugMode: ActionWithoutData = () => ({
  data: null,
  type: ActionTypes.disableDebugMode
});

export default {
  setExtensionPath,
  setGlobalStoragePath,
  setSubscriptions,
  enableDebugMode,
  disableDebugMode
};
