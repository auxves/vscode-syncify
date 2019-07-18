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
  autoUploadDelay: number;
  watchSettings: boolean;
  removeExtensions: boolean;
  syncOnStartup: boolean;
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
    "workspaceStorage",
    "globalStorage/state.vscdb*",
    "globalStorage/arnohovhannisyan.syncify",
    ".git"
  ],
  autoUploadDelay: 20,
  watchSettings: false,
  removeExtensions: true,
  syncOnStartup: false
};
