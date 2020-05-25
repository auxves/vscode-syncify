import { tmpdir } from "os";
import { resolve } from "path";

export function getCleanupPath(type: string): string {
	return resolve(tmpdir(), "vscode-syncify-tests", type);
}
