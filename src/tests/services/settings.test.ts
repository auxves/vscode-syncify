import { resolve } from "path";
import { defaultSettings, ISettings } from "~/models";
import { Environment, FS, Settings } from "~/services";
import { getCleanupPath } from "~/tests/getCleanupPath";

jest.mock("~/services/localize.ts");
jest.mock("~/utilities/confirm.ts");

const cleanupPath = getCleanupPath("services/settings");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

const pathToSettings = resolve(pathToTest, "settings.json");

jest.spyOn(Environment, "settings", "get").mockReturnValue(pathToSettings);
jest.spyOn(Environment, "globalStoragePath", "get").mockReturnValue(pathToTest);

beforeEach(async () => Promise.all(paths.map(FS.mkdir)));

afterEach(async () => FS.remove(cleanupPath));

test("set", async () => {
	await Settings.set({ watchSettings: true });

	const fetched: ISettings = JSON.parse(await FS.read(Environment.settings));

	expect(fetched.watchSettings).toBeTruthy();
});

test("get", async () => {
	const newSettings: ISettings = {
		...defaultSettings,
		watchSettings: true
	};

	await FS.write(Environment.settings, JSON.stringify(newSettings));

	const watchSettings = await Settings.get(s => s.watchSettings);

	expect(watchSettings).toBeTruthy();
});

test("immutability", async () => {
	const settings = await Settings.get();

	expect(settings).toStrictEqual(defaultSettings);
	expect(settings).not.toBe(defaultSettings);
});

test("reset", async () => {
	await Settings.set({ watchSettings: true });

	await Settings.reset();

	const exists = await FS.exists(Environment.settings);

	expect(exists).toBeFalsy();
});
