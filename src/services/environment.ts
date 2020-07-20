import { resolve } from "path";
import { Profiles, Settings } from "~/services";
import pkg from "~/../package.json";
import state from "~/state";

const resolvePromise = async (...args: Array<string | Promise<string>>) => {
	return resolve(...(await Promise.all(args)));
};

export const Environment = {
	get userFolder() {
		const path = process.env.VSCODE_PORTABLE
			? resolve(process.env.VSCODE_PORTABLE, "user-data")
			: resolve(Environment.globalStoragePath, "../../..");

		return resolve(path, "User");
	},

	get repoFolder() {
		return resolve(Environment.globalStoragePath, "repo");
	},

	get localSettings() {
		return resolve(Environment.globalStoragePath, "settings.json");
	},

	get localExportPath() {
		return (async () => {
			const { syncer, exportPath } = await Settings.local.get();
			return syncer === "git" ? Environment.repoFolder : exportPath;
		})();
	},

	get sharedSettings() {
		return resolvePromise(Environment.localExportPath, "syncify.json");
	},

	get currentProfileFolder() {
		return (async () => {
			const localExportPath = await Environment.localExportPath;
			const profile = (await Profiles.getCurrent())!;

			return resolve(localExportPath, profile.name);
		})();
	},

	get customFilesFolder() {
		return resolvePromise(Environment.currentProfileFolder, "customFiles");
	},

	get vsixFolder() {
		return resolvePromise(Environment.currentProfileFolder, "vsix");
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

	extensionId: `${pkg.publisher}.${pkg.name}`,

	oauthClientIds: {
		github: "0b56a3589b5582d11832",
		gitlab: "32c563edb04c312c7959fd1c4863e883878ed4af1f39d6d788c9758d4916a0db",
		bitbucket: "zhkr5tYsZsUfN9KkDn",
	},
};
