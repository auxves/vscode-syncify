import { normalize, resolve } from "path";
import pkg from "~/../package.json";
import { OperatingSystem } from "~/models";
import { store } from "~/redux/store";

export class Environment {
  public static get userFolder() {
    const slash = normalize("/");

    const path = process.env.VSCODE_PORTABLE
      ? resolve(process.env.VSCODE_PORTABLE, "user-data")
      : resolve(Environment.globalStoragePath, "../../..");

    return resolve(path, "User").concat(slash);
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
}
