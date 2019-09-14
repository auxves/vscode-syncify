import { FileMethod, RepoMethod } from "~/methods";
import { SyncMethod } from "~/models";

export class Factory {
  public static generate(syncMethod: SyncMethod) {
    return new (this.methods[syncMethod] || RepoMethod)();
  }

  private static get methods() {
    return {
      [SyncMethod.Repo]: RepoMethod,
      [SyncMethod.File]: FileMethod
    };
  }
}
