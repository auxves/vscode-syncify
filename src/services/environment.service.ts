import { normalize, resolve } from "path";
import { state } from "../state";

export class EnvironmentService {
  public locations = {
    userFolder: null
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
  }
}
