import { ActionKeys } from "~/models/action-keys";
import actions from "~/redux/actions";
import { IReduxState } from "~/redux/store";

type ActionWithName<N extends ActionKeys> = ReturnType<typeof actions[N]>;
type Handler<A extends ActionKeys> = (
  state: IReduxState,
  action: ActionWithName<A>
) => IReduxState;

const setExtensionPath: Handler<"setExtensionPath"> = (state, { data }) => ({
  ...state,
  extensionPath: data
});

const setGlobalStoragePath: Handler<"setGlobalStoragePath"> = (
  state,
  { data }
) => ({ ...state, globalStoragePath: data });

const setSubscriptions: Handler<"setSubscriptions"> = (state, { data }) => ({
  ...state,
  subscriptions: data
});

export default {
  setExtensionPath,
  setGlobalStoragePath,
  setSubscriptions
};
