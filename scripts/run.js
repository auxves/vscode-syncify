const { resolve } = require("path");
const { tmpdir } = require("os");
const { exec } = require("child_process");

const debugPath = resolve(tmpdir(), "vscode-syncify-debug");
const extensionsPath = resolve(debugPath, "extensions");
const userDataPath = resolve(debugPath, "user-data");
const workspacePath = resolve(__dirname, "..");

exec(
	[
		process.argv[2],
		`--extensionDevelopmentPath="${workspacePath}"`,
		`--user-data-dir="${userDataPath}"`,
		`--extensions-dir="${extensionsPath}"`
	].join(" ")
);
