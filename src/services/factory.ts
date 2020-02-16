import { ISyncer, Syncers } from "~/models";
import { FileSyncer, RepoSyncer } from "~/syncers";

export class Factory {
  public static generate(syncer: Syncers): ISyncer {
    return new this.syncers[syncer]();
  }

  private static get syncers() {
    return {
      [Syncers.Repo]: RepoSyncer,
      [Syncers.File]: FileSyncer
    };
  }
}
