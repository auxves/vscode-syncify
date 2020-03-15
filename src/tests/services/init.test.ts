import { resolve } from "path";
import { commands } from "vscode";
import { Environment, FS, init, Settings, Watcher } from "~/services";
import state from "~/state";
import { getCleanupPath } from "~/tests/getCleanupPath";

const cleanupPath = getCleanupPath("services/init");

const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStoragePath = resolve(cleanupPath, "user");

jest
	.spyOn(Environment, "globalStoragePath", "get")
	.mockReturnValue(pathToGlobalStoragePath);

const paths = [pathToUser, pathToGlobalStoragePath];

beforeEach(async () => {
	(state.context as any) = {
		subscriptions: []
	};

	return Promise.all(paths.map(FS.mkdir));
});

afterEach(async () => {
	state.context = undefined;

	return FS.remove(cleanupPath);
});

jest.mock("~/services/localize.ts");

test("command registration", async () => {
	const spy = jest.spyOn(commands, "registerCommand");

	await init();

	expect(spy).toHaveBeenCalled();

	spy.mockRestore();
});

test("command disposal", async () => {
	const fn = jest.fn();

	(state.context as any) = {
		subscriptions: [{ dispose: fn }]
	};

	await init();

	expect(fn).toHaveBeenCalled();
});

test("watch settings", async () => {
	await Settings.set({ watchSettings: true });

	const spy = jest.spyOn(Watcher, "start");

	await init();

	expect(spy).toHaveBeenCalled();

	spy.mockRestore();
});

test("sync on startup", async () => {
	await Settings.set({ syncOnStartup: true });

	const spy = jest.spyOn(commands, "executeCommand");

	await init();

	expect(spy).toHaveBeenCalledWith("syncify.sync");

	spy.mockRestore();
});
