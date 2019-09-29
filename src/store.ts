import { createStore, Reducer } from "redux";
import { Disposable } from "vscode";

export interface IReduxState {
  extensionPath: string;
  globalStoragePath: string;
  subscriptions: Disposable[];
}

const defaultState: IReduxState = {
  extensionPath: "",
  globalStoragePath: "",
  subscriptions: []
};

enum Actions {
  setExtensionPath = "SET -> EXTENSION PATH",
  setGlobalStoragePath = "SET -> GLOBAL STORAGE PATH",
  setSubscriptions = "SET -> SUBSCRIPTIONS",
  subscribeDisposable = "DISPOSABLE -> SUBSCRIBE"
}

export const actions = {
  setExtensionPath: (path: string) => ({
    data: path,
    type: Actions.setExtensionPath
  }),
  setGlobalStoragePath: (path: string) => ({
    data: path,
    type: Actions.setGlobalStoragePath
  }),
  setSubscriptions: (disposables: Disposable[]) => ({
    data: disposables,
    type: Actions.setSubscriptions
  }),
  subscribeDisposable: (disposable: Disposable) => ({
    data: disposable,
    type: Actions.subscribeDisposable
  })
};

const reducer: Reducer<IReduxState> = (state = defaultState, action) => {
  const { type, data } = action;

  switch (type) {
    case Actions.setExtensionPath:
      return { ...state, extensionPath: data };
    case Actions.setGlobalStoragePath:
      return { ...state, globalStoragePath: data };
    case Actions.setSubscriptions:
      return { ...state, subscriptions: data };
    case Actions.subscribeDisposable:
      return { ...state, subscriptions: [...state.subscriptions, data] };
    default:
      return { ...state };
  }
};

export const store = createStore(reducer);
