import { Syncer, Syncers } from "~/models";
import { FileSyncer, RepoSyncer } from "~/syncers";

export namespace Factory {
	export const generate = (syncer: Syncers): Syncer => {
		return new syncers[syncer]();
	};

	const syncers = {
		[Syncers.Repo]: RepoSyncer,
		[Syncers.File]: FileSyncer
	};
}
