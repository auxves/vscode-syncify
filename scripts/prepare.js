const { resolve } = require("path");
const fs = require("fs-extra");
const { tmpdir } = require("os");

const debugPath = resolve(tmpdir(), "vscode-syncify-debug");
const extensionsPath = resolve(debugPath, "extensions");
const userDataPath = resolve(debugPath, "user-data");

(async () => {
	await fs.emptyDir(debugPath);
	await Promise.all([fs.ensureDir(extensionsPath), fs.ensureDir(userDataPath)]);
})();
