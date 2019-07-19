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
  forceUpload: boolean;
  forceDownload: boolean;
}

export const defaultSettings: ISettings = {
  method: SyncMethod.Repo,
  repo: {
    url: "",
    profiles: [
      {
        branch: "master",
        name: "main"
      }
    ],
    currentProfile: "main"
  },
  file: {
    path: ""
  },
  github: {
    token: "",
    endpoint: "https://github.com",
    user: ""
  },
  ignoredItems: [
    "**/workspaceStorage",
    "**/globalStorage/state.vscdb*",
    "**/globalStorage/arnohovhannisyan.syncify",
    "**/.git"
  ],
  autoUploadDelay: 20,
  watchSettings: false,
  removeExtensions: true,
  syncOnStartup: false,
  hostname: "",
  forceDownload: false,
  forceUpload: false
};
