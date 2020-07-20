import { tmpdir } from "os";
import { resolve } from "path";

export const getCleanupPath = (type: string) => {
	return resolve(tmpdir(), "vscode-syncify-tests", type);
};
