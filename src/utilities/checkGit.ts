import { gte } from "semver";
import { tmpdir } from "os";
import createGit from "simple-git/promise";

export async function checkGit(required: string): Promise<boolean> {
	const git = createGit(tmpdir());
	const versionString = await git.raw(["--version"]);
	const version = versionString
		.trim()
		.split(" ")
		.find((s) => /^\d+?\.\d+?\.\d+?$/.test(s));

	if (!version) return false;

	return gte(version, required);
}
