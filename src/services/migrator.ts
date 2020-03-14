import { Migrations } from "~/models";
import state from "~/state";
import { Environment, Logger } from "~/services";
import { gt, lte, validRange, satisfies } from "semver";

function shouldMigrate(candidate: string, previous: string): boolean {
	if (validRange(candidate)) {
		if (satisfies(previous, candidate)) return false;
		return satisfies(Environment.version, candidate);
	}

	if (lte(candidate, previous)) return false;
	if (gt(candidate, Environment.version)) return false;

	return true;
}

export async function migrate(migrations: Migrations): Promise<void> {
	const globalState = state.context?.globalState;

	if (!globalState) return;

	const previous = globalState.get<string>("version") ?? "0.0.0";

	if (previous !== Environment.version) {
		await globalState.update("version", Environment.version);
	}

	const newerVersions = Object.keys(migrations).filter(candidate =>
		shouldMigrate(candidate, previous)
	);

	if (newerVersions.length === 0) return;

	try {
		for await (const version of newerVersions) {
			await migrations[version]();
		}
	} catch (error) {
		return Logger.error(error);
	}
}
