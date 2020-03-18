import { resolve } from "path";
import pkg from "~/../package.json";
import state from "~/state";

export const Environment = {
	pkg,

	get userFolder() {
		const path = process.env.VSCODE_PORTABLE
			? resolve(process.env.VSCODE_PORTABLE, "user-data")
			: resolve(Environment.globalStoragePath, "../../..");

		return resolve(path, "User");
	},

	get repoFolder() {
		return resolve(Environment.globalStoragePath, "repo");
	},

	get settings() {
		return resolve(Environment.globalStoragePath, "settings.json");
	},

	get customFilesFolder() {
		return resolve(Environment.userFolder, "customFiles");
	},

	get vsixFolder() {
		return resolve(Environment.userFolder, "vsix");
	},

	get conflictsFolder() {
		return resolve(Environment.globalStoragePath, "conflicts");
	},

	get globalStoragePath() {
		return state.context?.globalStoragePath ?? "";
	},

	get extensionPath() {
		return state.context?.extensionPath ?? "";
	},

	get os() {
		if (process.platform === "win32") return "windows";
		if (process.platform === "darwin") return "mac";
		return "linux";
	},

	version: pkg.version,

	extensionId: `${pkg.publisher}.${pkg.name}`,

	oauthClientIds: {
		github: "0b56a3589b5582d11832",
		gitlab: "32c563edb04c312c7959fd1c4863e883878ed4af1f39d6d788c9758d4916a0db",
		bitbucket: "zhkr5tYsZsUfN9KkDn"
	}
};
