import { SyncMethod } from "../models/sync-method.model";
import { RepoService } from "./repo.service";

export class FactoryService {
  public static generate(syncMethod: SyncMethod) {
    return new this.methods[syncMethod]();
  }
  private static methods = {
    [SyncMethod.RepoService]: RepoService
  };
}
