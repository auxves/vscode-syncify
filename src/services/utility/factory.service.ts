import { SyncMethod } from "../../models/sync-method.model";
import { FileService } from "../sync/file.service";
import { RepoService } from "../sync/repo.service";

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
