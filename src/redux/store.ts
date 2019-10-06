import { createStore } from "redux";
import { Disposable } from "vscode";
import { ActionTypes, IActions } from "~/redux/actions";
import handlers from "~/redux/handlers";

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

const reducer = (state: IReduxState = defaultState, action: IActions) => {
  switch (action.type) {
    case ActionTypes.setExtensionPath:
      return handlers.setExtensionPath(state, action);
    case ActionTypes.setGlobalStoragePath:
      return handlers.setGlobalStoragePath(state, action);
    case ActionTypes.setSubscriptions:
      return handlers.setSubscriptions(state, action);
    default:
      return { ...state };
  }
};

export const store = createStore(reducer);
