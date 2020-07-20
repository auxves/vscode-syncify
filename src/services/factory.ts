import { LocalSettings, Syncer } from "~/models";
import { FileSyncer, GitSyncer } from "~/syncers";

export namespace Factory {
	const syncers = {
		git: GitSyncer,
		file: FileSyncer,
	};

	export const generate = (type: LocalSettings["syncer"]): Syncer => {
		return new syncers[type]();
	};
}
