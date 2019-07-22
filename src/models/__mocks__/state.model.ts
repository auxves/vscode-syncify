import { FileSystemService } from "../../services/utility/fs.service";
import { SyncMethod } from "../sync-method.model";

export const state = {
  watcher: {
    stopWatching: () => null,
    startWatching: () => null
  },
  settings: {
    getSettings: () => ({
      method: SyncMethod.Repo,
      repo: {
        url: "/tmp/jest/repo.service.test.ts/remote",
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
      hostname: "jest",
      forceDownload: false,
      forceUpload: false
    })
  },
  webview: {
    openLandingPage: () => null
  },
  env: {
    locations: {
      repoFolder: "/tmp/jest/repo.service.test.ts/repo",
      userFolder: "/tmp/jest/repo.service.test.ts/user"
    }
  },
  fs: (() => {
    if (FileSystemService) {
      return new FileSystemService();
    }
  })(),
  localize: v => v,
  extensions: {
    getMissingExtensions: v => v,
    getUnneededExtensions: () => []
  }
};
