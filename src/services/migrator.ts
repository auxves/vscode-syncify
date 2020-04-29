import { Migration } from "~/models";
import state from "~/state";
import { Environment, Logger } from "~/services";
import { validRange, satisfies } from "semver";

function shouldMigrate(candidate: string, previous: string): boolean {
	if (validRange(candidate)) {
		if (satisfies(previous, candidate)) return false;
		return satisfies(Environment.version, candidate);
	}

	return false;
}

export async function migrate(
	migrations: Map<string, Migration>,
): Promise<void> {
	const globalState = state.context?.globalState;

	if (!globalState) return;

	const previous = globalState.get<string>("version") ?? "0.0.0";

	if (previous !== Environment.version) {
		await globalState.update("version", Environment.version);
	}

	const newerVersions = Array.from(migrations.keys()).filter((candidate) =>
		shouldMigrate(candidate, previous),
	);

	if (newerVersions.length === 0) return;

	try {
		for await (const version of newerVersions) {
			await migrations.get(version)!(previous);
		}
	} catch (error) {
		Logger.error(error);
	}
}
