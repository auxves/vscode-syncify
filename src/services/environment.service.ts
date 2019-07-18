import { normalize, resolve } from "path";
import { state } from "../models/state.model";

export class EnvironmentService {
  public locations = {
    userFolder: null,
    repoFolder: null
  };

  constructor() {
    const slash = normalize("/");
    if (!process.env.VSCODE_PORTABLE) {
      const path = resolve(state.context.globalStoragePath, "../../..").concat(
        slash
      );
      this.locations.userFolder = resolve(path, "User").concat(slash);
    } else {
      const path = process.env.VSCODE_PORTABLE;
      this.locations.userFolder = resolve(path, "user-data/User").concat(slash);
    }

    this.locations.repoFolder = resolve(
      state.context.globalStoragePath,
      "repo"
    );
  }
}
