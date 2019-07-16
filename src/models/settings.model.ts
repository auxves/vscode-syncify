import { SyncMethod } from "./sync-method.model";

export interface ISettings {
  method: SyncMethod;
  [SyncMethod.Repo]: {
    url: string;
  };
  [SyncMethod.File]: {
    path: string;
    bob: string;
  };
}

export const defaultSettings: ISettings = {
  method: SyncMethod.Repo,
  [SyncMethod.Repo]: {
    url: null
  },
  [SyncMethod.File]: {
    path: null,
    bob: null
  }
};
