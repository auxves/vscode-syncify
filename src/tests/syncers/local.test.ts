import { resolve } from "path";
import { LocalSettings } from "~/models";
import { Environment, FS, Settings } from "~/services";
import { LocalSyncer } from "~/syncers";
import { getCleanupPath } from "~/tests/get-cleanup-path";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("syncers/local");

const pathToExport = resolve(cleanupPath, "export");
const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStorage = resolve(cleanupPath, "globalStoragePath");

const paths = [pathToExport, pathToUser, pathToGlobalStorage];

const pathToSettings = resolve(pathToUser, "settings.json");
const pathToExportSettings = resolve(pathToExport, "main/settings.json");

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);

jest
	.spyOn(Environment, "globalStoragePath", "get")
	.mockReturnValue(pathToGlobalStorage);

const currentSettings: Partial<LocalSettings> = {
	syncer: "local",
	exportPath: pathToExport,
};

beforeEach(async () => Promise.all(paths.map(async (path) => FS.mkdir(path))));

afterEach(async () => FS.remove(cleanupPath));

describe("upload", () => {
	test("basic functionality", async () => {
		await Settings.local.set(currentSettings);

		const userData = JSON.stringify({ "test.key": true }, undefined, 2);

		await FS.write(pathToSettings, userData);

		const localSyncer = new LocalSyncer();
		await localSyncer.upload();

		const uploadedData = await FS.read(pathToExportSettings);
		expect(uploadedData).toBe(userData);
	});

	test("binary files", async () => {
		await Settings.local.set(currentSettings);

		const buffer = Buffer.alloc(2, 1);

		await FS.write(resolve(pathToUser, "buffer"), buffer);

		const localSyncer = new LocalSyncer();
		await localSyncer.upload();

		const uploadedBuffer = await FS.readBuffer(resolve(pathToExport, "buffer"));

		expect(buffer.compare(uploadedBuffer)).toBe(0);
	});
});

describe("download", () => {
	test("basic functionality", async () => {
		await Settings.local.set(currentSettings);

		const settings = JSON.stringify({ "test.key": true }, undefined, 2);

		const extensions = JSON.stringify(["1", "2", "3"]);

		await FS.write(pathToExportSettings, settings);
		await FS.write(resolve(pathToExport, "extensions.json"), extensions);

		const localSyncer = new LocalSyncer();
		await localSyncer.download();

		const downloadedSettings = await FS.read(pathToSettings);

		const downloadedExtensions = await FS.read(
			resolve(pathToUser, "extensions.json"),
		);

		expect(downloadedSettings).toBe(settings);
		expect(downloadedExtensions).toBe(extensions);
	});

	test("binary files", async () => {
		await Settings.local.set(currentSettings);

		const buffer = Buffer.alloc(2, 1);

		await FS.write(resolve(pathToExport, "buffer"), buffer);

		const localSyncer = new LocalSyncer();
		await localSyncer.download();

		const downloadedBuffer = await FS.readBuffer(resolve(pathToUser, "buffer"));

		expect(buffer.compare(downloadedBuffer)).toBe(0);
	});
});
