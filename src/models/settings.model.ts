import { SyncMethod } from "./sync-method.model";

export interface ISettings {
  method: SyncMethod;
  state: {
    lastUpload: Date;
  };
}

export const defaultSettings: ISettings = {
  method: SyncMethod.RepoService,
  state: {
    lastUpload: null
  }
};
