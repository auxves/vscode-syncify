import { defaultSettings, SyncMethod } from "@/models";
import { Environment, FileService, FS, Settings } from "@/services";
import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/sync/file.service");
const pathToExport = `${cleanupPath}/export`;
const pathToUser = `${cleanupPath}/user`;

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);

Settings.get = jest.fn(async () => ({
  ...defaultSettings,
  method: SyncMethod.File,
  file: {
    path: pathToExport
  },
  hostname: "jest"
}));

beforeEach(() => Promise.all([ensureDir(pathToExport), ensureDir(pathToUser)]));

afterEach(() => remove(cleanupPath));

describe("upload", () => {
  it("should upload", async () => {
    const userData = {
      "test.key": true
    };
    const expected = JSON.stringify(userData, null, 2);
    await FS.write(resolve(pathToUser, "settings.json"), expected);

    const fileService = new FileService();
    await fileService.upload();

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

    const fileService = new FileService();
    await fileService.download();

    const downloadedData = await FS.read(resolve(pathToUser, "settings.json"));
    expect(downloadedData).toBe(expected);
  });
});
