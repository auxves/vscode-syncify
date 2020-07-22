import { LocalSettings, Syncer } from "~/models";
import { LocalSyncer, GitSyncer } from "~/syncers";

export namespace Factory {
	const syncers = {
		git: GitSyncer,
		local: LocalSyncer,
	};

	export const generate = (type: LocalSettings["syncer"]): Syncer => {
		return new syncers[type]();
	};
}
