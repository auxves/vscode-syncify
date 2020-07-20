import createSimpleGit from "simple-git";
import { resolve } from "path";
import { window } from "vscode";
import { LocalSettings } from "~/models";
import { Environment, FS, localize, Profiles, Settings } from "~/services";
import { GitSyncer } from "~/syncers";
import { getCleanupPath } from "~/tests/get-cleanup-path";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("syncers/git");

const pathToRemote = resolve(cleanupPath, "remote");
const pathToRepo = resolve(cleanupPath, "repo");
const pathToTemporaryRepo = resolve(cleanupPath, "tmpRepo");
const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStorage = resolve(cleanupPath, "globalStoragePath");

const paths = [
	pathToRemote,
	pathToRepo,
	pathToTemporaryRepo,
	pathToUser,
	pathToGlobalStorage,
];

const pathToSettings = resolve(pathToUser, "settings.json");

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);
jest.spyOn(Environment, "repoFolder", "get").mockReturnValue(pathToRepo);

jest
	.spyOn(Environment, "globalStoragePath", "get")
	.mockReturnValue(pathToGlobalStorage);

jest.setTimeout(15000);

const currentSettings: Partial<LocalSettings> = {
	exportPath: pathToRemote,
};

beforeEach(async () => {
	await Promise.all(paths.map(async (path) => FS.mkdir(path)));
	return createSimpleGit(pathToRemote).init(true);
});

afterEach(async () => FS.remove(cleanupPath));

describe("upload", () => {
	test("basic functionality", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const uploadedData = await FS.read(pathToSettings);
		expect(uploadedData).toBe(userData);
	});

	test("behind remote", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const expected = JSON.stringify({ "test.key": false }, undefined, 2);

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "master", { "--force": null });

		await FS.write(resolve(pathToTemporaryRepo, "settings.json"), expected);

		await git.add(".");
		await git.commit("Testing");
		await git.push("origin", "master", { "--force": null });

		await gitSyncer.upload();

		await git.pull("origin", "master", { "--force": null });

		const syncedData = await FS.read(
			resolve(pathToTemporaryRepo, "settings.json"),
		);

		expect(syncedData).toBe(expected);
	});

	test("ignore items", async () => {
		await Settings.local.set(currentSettings);

		const expected = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, expected);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const exists = await FS.exists(resolve(pathToRepo, "workspaceStorage"));
		expect(exists).toBeFalsy();

		const settingsData = await FS.read(pathToSettings);
		expect(settingsData).toBe(expected);
	});

	test("up to date", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const spy = jest.spyOn(window, "setStatusBarMessage");

		await gitSyncer.upload();

		expect(spy).toHaveBeenCalledWith(
			localize("(info) repo -> remoteUpToDate"),
			2000,
		);

		spy.mockRestore();
	});

	test("binary files", async () => {
		await Settings.local.set(currentSettings);

		const pathToBuffer = resolve(pathToUser, "buffer");

		const buffer = Buffer.alloc(2, 1);

		await FS.write(pathToBuffer, buffer);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "master", { "--force": null });

		const downloadedBuffer = await FS.readBuffer(
			resolve(pathToTemporaryRepo, "buffer"),
		);

		expect(buffer.compare(downloadedBuffer)).toBe(0);
	});
});

describe("download", () => {
	test("basic functionality", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const expected = JSON.stringify({ "test.key": false }, undefined, 2);

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "master", { "--force": null });

		await FS.write(resolve(pathToTemporaryRepo, "settings.json"), expected);

		await git.add(".");
		await git.commit("Testing");
		await git.push("origin", "master", { "--force": null });

		await gitSyncer.download();

		const downloadedData = await FS.read(pathToSettings);

		expect(downloadedData.replace(/\r\n/g, "\n")).toBe(expected);
	});

	test("create branch if first download", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		await new GitSyncer().upload();

		await FS.remove(pathToRepo);

		await new GitSyncer().download();

		const downloadedData = await FS.read(pathToSettings);

		expect(downloadedData.replace(/\r\n/g, "\n")).toBe(userData);
	});

	test("ahead of remote", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		await new GitSyncer().download();

		const currentData = await FS.read(pathToSettings);
		expect(currentData).toBe(userData);
	});

	test("switch profiles", async () => {
		await Settings.shared.set({
			profiles: [
				{ name: "test1", extensions: [] },
				{ name: "test2", extensions: [] },
			],
		});

		await Settings.local.set({ ...currentSettings, currentProfile: "test1" });

		const userData = JSON.stringify({ "test.key": 1 }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		await Profiles.switchProfile("test2");

		const newUserData = JSON.stringify({ "test.key": 2 }, undefined, 2);

		await FS.write(pathToSettings, newUserData);

		await gitSyncer.upload();
		await Profiles.switchProfile("test1");
		await gitSyncer.download();

		const downloadedData = await FS.read(pathToSettings);

		expect(downloadedData.replace(/\r\n/g, "\n")).toBe(userData);
	});

	test("download new profile", async () => {
		await Settings.shared.set({
			profiles: [
				{ name: "test1", extensions: [] },
				{ name: "test2", extensions: [] },
			],
		});

		await Settings.local.set({ ...currentSettings, currentProfile: "test1" });

		const userData = JSON.stringify({ "test.key": 1 }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const newUserData = JSON.stringify({ "test.key": 2 }, undefined, 2);

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "test1", { "--force": null });

		await git.checkout(["-b", "test2"]);

		await FS.write(resolve(pathToTemporaryRepo, "settings.json"), newUserData);

		await git.add(".");
		await git.commit("Testing");
		await git.push("origin", "test2");

		await Profiles.switchProfile("test2");

		await gitSyncer.download();

		const downloadedData = await FS.read(pathToSettings);

		expect(downloadedData.replace(/\r\n/g, "\n")).toBe(newUserData);
	});

	test("up to date", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const spy = jest.spyOn(window, "setStatusBarMessage");

		await gitSyncer.download();

		expect(spy).toHaveBeenCalledWith(localize("(info) repo -> upToDate"), 2000);

		spy.mockRestore();
	});

	test("merge if dirty", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const expected = JSON.stringify({ "test.key": false }, undefined, 2);

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "master", { "--force": null });

		await FS.write(resolve(pathToTemporaryRepo, "settings.json"), expected);

		await git.add(".");
		await git.commit("Testing");
		await git.push("origin", "master", { "--force": null });

		const keybindings = JSON.stringify([1, 2, 3]);
		const pathToKeybindings = resolve(pathToUser, "keybindings.json");

		await FS.write(pathToKeybindings, keybindings);

		await gitSyncer.download();

		const downloadedData = await FS.read(pathToSettings);
		expect(downloadedData.replace(/\r\n/g, "\n")).toBe(expected);

		const keybindingsData = await FS.read(pathToKeybindings);
		expect(keybindingsData.replace(/\r\n/g, "\n")).toBe(keybindings);
	});

	test("binary files", async () => {
		await Settings.local.set(currentSettings);

		const pathToBuffer = resolve(pathToUser, "buffer");

		await FS.write(pathToBuffer, Buffer.alloc(2).fill(0));

		const gitSyncer = new GitSyncer();
		await gitSyncer.upload();

		const git = createSimpleGit(pathToTemporaryRepo);
		await git.init();
		await git.addRemote("origin", pathToRemote);
		await git.pull("origin", "master", { "--force": null });

		const buffer = Buffer.alloc(2, 1);

		await FS.write(resolve(pathToTemporaryRepo, "buffer"), buffer);

		await git.add(".");
		await git.commit("Testing");
		await git.push("origin", "master", { "--force": null });

		await gitSyncer.download();

		const downloadedBuffer = await FS.readBuffer(pathToBuffer);

		expect(buffer.compare(downloadedBuffer)).toBe(0);
	});
});
