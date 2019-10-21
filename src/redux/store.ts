import { createStore } from "redux";
import { Disposable } from "vscode";
import { ActionKeys } from "~/models";
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

function getKey(action: IActions): ActionKeys | undefined {
  const entries = Object.entries(ActionTypes);
  const type = entries.find(([, val]) => val === action.type);

  if (type) return type[0] as ActionKeys;
}

const reducer = (state: IReduxState = defaultState, action: IActions) => {
  const key = getKey(action);

  if (key) return handlers[key](state, action);

  return { ...state };
};

export const store = createStore(reducer, defaultState);
