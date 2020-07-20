import { resolve } from "path";
import { window } from "vscode";
import {
	defaultLocalSettings,
	defaultSharedSettings,
	LocalSettings,
	SharedSettings,
} from "~/models";
import { Environment, FS, Settings } from "~/services";
import { getCleanupPath } from "~/tests/get-cleanup-path";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("services/settings");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

jest
	.spyOn(Environment, "localSettings", "get")
	.mockReturnValue(resolve(pathToTest, "settings.json"));

jest
	.spyOn(Environment, "sharedSettings", "get")
	.mockReturnValue(Promise.resolve(resolve(pathToTest, "syncify.json")));

jest.spyOn(Environment, "globalStoragePath", "get").mockReturnValue(pathToTest);

beforeEach(async () => Promise.all(paths.map(async (path) => FS.mkdir(path))));

afterEach(async () => FS.remove(cleanupPath));

describe("local", () => {
	test("set", async () => {
		await Settings.local.set({ hostname: "x" });

		const fetched: LocalSettings = JSON.parse(
			await FS.read(Environment.localSettings),
		);

		expect(fetched.hostname).toBe("x");
	});

	test("get", async () => {
		const newSettings: LocalSettings = {
			...defaultLocalSettings,
			hostname: "y",
		};

		await FS.write(Environment.localSettings, JSON.stringify(newSettings));

		const { hostname } = await Settings.local.get();

		expect(hostname).toBe("y");
	});
});

describe("shared", () => {
	test("set", async () => {
		await Settings.shared.set({ profiles: [{ name: "x", extensions: [] }] });

		const { profiles }: SharedSettings = JSON.parse(
			await FS.read(resolve(Environment.repoFolder, "syncify.json")),
		);

		expect(profiles[0].name).toBe("x");
	});

	test("get", async () => {
		const newSettings: SharedSettings = {
			...defaultSharedSettings,
			profiles: [{ name: "y", extensions: [] }],
		};

		await FS.write(
			resolve(Environment.repoFolder, "syncify.json"),
			JSON.stringify(newSettings),
		);

		const { profiles } = await Settings.shared.get();

		expect(profiles[0].name).toBe("y");
	});
});

test("reset", async () => {
	const spy = jest
		.spyOn(window, "showWarningMessage")
		.mockImplementationOnce(() => "(label) yes" as any);

	await Settings.local.set({});

	await Settings.reset();

	const exists = await FS.exists(Environment.localSettings);

	expect(exists).toBeFalsy();

	spy.mockRestore();
});
