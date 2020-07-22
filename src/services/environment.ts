import { resolve } from "path";
import { Profiles, Settings } from "~/services";
import pkg from "~/../package.json";
import state from "~/state";

export const userFolder = () => {
	const path = process.env.VSCODE_PORTABLE
		? resolve(process.env.VSCODE_PORTABLE, "user-data")
		: resolve(globalStoragePath(), "../../..");

	return resolve(path, "User");
};

export const repoFolder = () => {
	return resolve(globalStoragePath(), "repo");
};

export const localSettings = () => {
	return resolve(globalStoragePath(), "settings.json");
};

export const localExportPath = async () => {
	const { syncer, exportPath } = await Settings.local.get();
	return syncer === "git" ? repoFolder() : exportPath;
};

export const sharedSettings = async () => {
	return resolve(await localExportPath(), "syncify.json");
};

export const currentProfileFolder = async () => {
	const profile = (await Profiles.getCurrent())!;

	return resolve(await localExportPath(), profile.name);
};

export const customFilesFolder = async () => {
	return resolve(await currentProfileFolder(), "customFiles");
};

export const vsixFolder = async () => {
	return resolve(await currentProfileFolder(), "vsix");
};

export const conflictsFolder = () => {
	return resolve(globalStoragePath(), "conflicts");
};

export const globalStoragePath = () => {
	return state.context?.globalStoragePath ?? "";
};

export const extensionPath = () => {
	return state.context?.extensionPath ?? "";
};

export const os = () => {
	if (process.platform === "win32") return "windows";
	if (process.platform === "darwin") return "mac";
	return "linux";
};

export const extensionId = `${pkg.publisher}.${pkg.name}`;

export const oauthClientIds = {
	github: "0b56a3589b5582d11832",
	gitlab: "32c563edb04c312c7959fd1c4863e883878ed4af1f39d6d788c9758d4916a0db",
	bitbucket: "zhkr5tYsZsUfN9KkDn",
};
