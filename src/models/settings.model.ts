import { IProfile } from "./profile.model";
import { SyncMethod } from "./sync-method.model";

export interface ISettings {
  method: SyncMethod;
  repo: {
    url: string;
    profiles: IProfile[];
    currentProfile: string;
  };
  file: {
    path: string;
  };
  ignoredItems: string[];
}

export const defaultSettings: ISettings = {
  method: SyncMethod.Repo,
  repo: {
    url: null,
    profiles: [
      {
        branch: "master",
        name: "main"
      }
    ],
    currentProfile: "main"
  },
  file: {
    path: null
  },
  ignoredItems: [
    "/workspaceStorage",
    "/globalStorage/state.vscdb*",
    "/globalStorage/arnohovhannisyan.syncify/settings.json"
  ]
};
