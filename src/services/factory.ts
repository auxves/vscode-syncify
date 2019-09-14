import { Syncer } from "~/models";
import { FileSyncer, RepoSyncer } from "~/syncers";

export class Factory {
  public static generate(syncer: Syncer) {
    return new (this.syncers[syncer] || RepoSyncer)();
  }

  private static get syncers() {
    return {
      [Syncer.Repo]: RepoSyncer,
      [Syncer.File]: FileSyncer
    };
  }
}
