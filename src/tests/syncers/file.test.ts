import { resolve } from "path";
import { Syncers } from "~/models";
import { Environment, FS, Settings } from "~/services";
import { FileSyncer } from "~/syncers";
import { getCleanupPath } from "~/tests/getCleanupPath";
import { stringifyPretty } from "~/utilities";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("syncers/file");

const pathToExport = resolve(cleanupPath, "export");
const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStoragePath = resolve(cleanupPath, "globalStoragePath");

const paths = [pathToExport, pathToUser, pathToGlobalStoragePath];

const pathToSettings = resolve(pathToUser, "settings.json");
const pathToExportSettings = resolve(pathToExport, "settings.json");

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(pathToGlobalStoragePath);

const currentSettings = {
  syncer: Syncers.File,
  file: {
    path: pathToExport
  }
};

beforeEach(() => Promise.all(paths.map(FS.mkdir)));

afterEach(() => FS.delete(cleanupPath));

describe("upload", () => {
  test("basic functionality", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const fileSyncer = new FileSyncer();
    await fileSyncer.upload();

    const uploadedData = await FS.read(pathToExportSettings);
    expect(uploadedData).toBe(userData);
  });

  test("binary files", async () => {
    await Settings.set(currentSettings);

    const buffer = Buffer.alloc(2).fill(1);

    await FS.write(resolve(pathToUser, "buffer"), buffer);

    const fileSyncer = new FileSyncer();
    await fileSyncer.upload();

    const uploadedBuffer = await FS.read(resolve(pathToExport, "buffer"), true);

    expect(Buffer.compare(buffer, uploadedBuffer)).toBe(0);
  });
});

describe("download", () => {
  test("basic functionality", async () => {
    await Settings.set(currentSettings);

    const settings = stringifyPretty({
      "test.key": true
    });

    const extensions = stringifyPretty([1, 2, 3]);

    await FS.write(pathToExportSettings, settings);
    await FS.write(resolve(pathToExport, "extensions.json"), extensions);

    const fileSyncer = new FileSyncer();
    await fileSyncer.download();

    const downloadedSettings = await FS.read(pathToSettings);

    const downloadedExtensions = await FS.read(
      resolve(pathToUser, "extensions.json")
    );

    expect(downloadedSettings).toBe(settings);
    expect(downloadedExtensions).toBe(extensions);
  });

  test("binary files", async () => {
    await Settings.set(currentSettings);

    const buffer = Buffer.alloc(2).fill(1);

    await FS.write(resolve(pathToExport, "buffer"), buffer);

    const fileSyncer = new FileSyncer();
    await fileSyncer.download();

    const downloadedBuffer = await FS.read(resolve(pathToUser, "buffer"), true);

    expect(Buffer.compare(buffer, downloadedBuffer)).toBe(0);
  });
});
