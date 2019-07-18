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
  github: {
    token: string;
    endpoint: string;
    user: string;
  };
  ignoredItems: string[];
  autoUploadDelay: number;
  watchSettings: boolean;
  removeExtensions: boolean;
  syncOnStartup: boolean;
  hostname: string;
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
  github: {
    token: null,
    endpoint: "https://github.com",
    user: null
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
  syncOnStartup: false,
  hostname: null
};
