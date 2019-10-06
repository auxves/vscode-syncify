import actions from "~/redux/actions";
import { IReduxState } from "~/redux/store";

type Handler<A> = (state: IReduxState, action: A) => IReduxState;
type ActionNames = keyof typeof actions;
type Handlers = { [P in ActionNames]: Handler<ReturnType<typeof actions[P]>> };

const handlers: Handlers = {
  setExtensionPath(state, { data }) {
    return { ...state, extensionPath: data };
  },
  setGlobalStoragePath(state, { data }) {
    return { ...state, globalStoragePath: data };
  },
  setSubscriptions(state, { data }) {
    return { ...state, subscriptions: data };
  }
};

export default handlers;
