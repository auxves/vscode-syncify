import { normalize, resolve } from "path";
import pkg from "~/../package.json";
import { OperatingSystem, state } from "~/models";
import { store } from "~/store";

export class Environment {
  public static get userFolder() {
    const slash = normalize("/");

    const path = process.env.VSCODE_PORTABLE
      ? resolve(process.env.VSCODE_PORTABLE, "user-data")
      : resolve(store.getState().globalStoragePath, "../../..");

    return resolve(path, "User").concat(slash);
  }

  public static get repoFolder() {
    return resolve(store.getState().globalStoragePath, "repo");
  }

  public static get settings() {
    return resolve(store.getState().globalStoragePath, "settings.json");
  }

  public static get customFilesFolder() {
    return resolve(Environment.userFolder, "customFiles");
  }

  public static os = process.platform as OperatingSystem;

  public static extensionId = `${pkg.publisher}.${pkg.name}`;
  public static pkg = pkg;
}
