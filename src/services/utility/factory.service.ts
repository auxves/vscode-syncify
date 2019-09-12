import { SyncMethod } from "~/models";
import { FileService, RepoService } from "~/services";

export class FactoryService {
  public static generate(syncMethod: SyncMethod) {
    const method = this.methods[syncMethod];
    if (method) {
      return new method();
    }
    return new RepoService();
  }

  private static methods = {
    [SyncMethod.Repo]: RepoService,
    [SyncMethod.File]: FileService
  };
}
