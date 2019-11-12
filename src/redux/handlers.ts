import { ActionKeys } from "~/models/action-keys";
import actions, { IActions } from "~/redux/actions";
import { IReduxState } from "~/redux/store";

type ActionWithName<N extends ActionKeys> = ReturnType<typeof actions[N]>;
type ExtractData<R> = R extends IActions<infer I> ? I : any;
type Handler<A extends ActionKeys> = (
  state: IReduxState,
  action: ExtractData<ActionWithName<A>>
) => IReduxState;

const setExtensionPath: Handler<"setExtensionPath"> = (state, data) => ({
  ...state,
  extensionPath: data
});

const setGlobalStoragePath: Handler<"setGlobalStoragePath"> = (
  state,
  data
) => ({ ...state, globalStoragePath: data });

const setSubscriptions: Handler<"setSubscriptions"> = (state, data) => ({
  ...state,
  subscriptions: data
});

const enableDebugMode: Handler<"enableDebugMode"> = state => ({
  ...state,
  isDebugMode: true
});

const disableDebugMode: Handler<"disableDebugMode"> = state => ({
  ...state,
  isDebugMode: false
});

export default {
  setExtensionPath,
  setGlobalStoragePath,
  setSubscriptions,
  enableDebugMode,
  disableDebugMode
};
