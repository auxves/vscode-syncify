import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { defaultSettings, Syncer } from "~/models";
import { Environment, FS, Settings } from "~/services";
import { FileSyncer } from "~/syncers";

jest.mock("~/services/localization.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/syncers/file");
const pathToExport = `${cleanupPath}/export`;
const pathToUser = `${cleanupPath}/user`;
const pathToGlobalStoragePath = `${cleanupPath}/globalStoragePath`;

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(pathToGlobalStoragePath);

const currentSettings = {
  ...defaultSettings,
  syncer: Syncer.File,
  file: {
    path: pathToExport
  },
  hostname: "jest"
};

Settings.get = jest
  .fn()
  .mockImplementation(async (selector: any) =>
    selector ? selector(currentSettings) : currentSettings
  );

beforeEach(() => Promise.all([ensureDir(pathToExport), ensureDir(pathToUser)]));

afterEach(() => remove(cleanupPath));

describe("upload", () => {
  it("should upload", async () => {
    const userData = {
      "test.key": true
    };
    const expected = JSON.stringify(userData, null, 2);
    await FS.write(resolve(pathToUser, "settings.json"), expected);

    const fileSyncer = new FileSyncer();
    await fileSyncer.upload();

    const uploadedData = await FS.read(resolve(pathToExport, "settings.json"));
    expect(uploadedData).toBe(expected);
  });
});

describe("download", () => {
  it("should download", async () => {
    const expected = JSON.stringify(
      {
        "test.key": true
      },
      null,
      2
    );

    await FS.write(resolve(pathToExport, "settings.json"), expected);

    const fileSyncer = new FileSyncer();
    await fileSyncer.download();

    const downloadedData = await FS.read(resolve(pathToUser, "settings.json"));
    expect(downloadedData).toBe(expected);
  });
});
