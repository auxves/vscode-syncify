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
  it("should upload", async () => {
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
});

describe("download", () => {
  it("should download", async () => {
    await Settings.set(currentSettings);

    const expected = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToExportSettings, expected);

    const fileSyncer = new FileSyncer();
    await fileSyncer.download();

    const downloadedData = await FS.read(pathToSettings);
    expect(downloadedData).toBe(expected);
  });
});
