import { normalize, resolve } from "path";
import pkg from "~/../package.json";
import { OperatingSystem } from "~/models";
import { store } from "~/redux/store";

export class Environment {
  public static get userFolder() {
    const path = process.env.VSCODE_PORTABLE
      ? resolve(process.env.VSCODE_PORTABLE, "user-data")
      : resolve(Environment.globalStoragePath, "../../..");

    return resolve(path, "User");
  }

  public static get repoFolder() {
    return resolve(Environment.globalStoragePath, "repo");
  }

  public static get settings() {
    return resolve(Environment.globalStoragePath, "settings.json");
  }

  public static get customFilesFolder() {
    return resolve(Environment.userFolder, "customFiles");
  }

  public static get conflictsFolder() {
    return resolve(Environment.globalStoragePath, "conflicts");
  }

  public static get globalStoragePath() {
    return store.getState().globalStoragePath;
  }

  public static get extensionPath() {
    return store.getState().extensionPath;
  }

  public static os = process.platform as OperatingSystem;

  public static extensionId = `${pkg.publisher}.${pkg.name}`;
  public static pkg = pkg;

  public static oauthClientIds = {
    github: "0b56a3589b5582d11832",
    gitlab: "32c563edb04c312c7959fd1c4863e883878ed4af1f39d6d788c9758d4916a0db",
    bitbucket: "zhkr5tYsZsUfN9KkDn"
  };
}
