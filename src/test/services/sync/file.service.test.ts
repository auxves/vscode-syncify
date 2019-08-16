import { state } from "@/models";
import { FileService, FileSystemService } from "@/services";
import { ensureDir, remove } from "fs-extra";
import { resolve } from "path";

const fs = new FileSystemService();

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = "/tmp/jest/file.service.test.ts";
const pathToExport = `${cleanupPath}/export`;
const pathToUser = `${cleanupPath}/user`;

state.env.locations = {
  ...state.env.locations,
  userFolder: pathToUser
};

beforeEach(async () => {
  return Promise.all([ensureDir(pathToExport), ensureDir(pathToUser)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

describe("upload", () => {
  it("should upload", async () => {
    const userData = {
      "test.key": true
    };
    const expected = JSON.stringify(userData, null, 2);
    await fs.write(resolve(pathToUser, "settings.json"), expected);

    const fileService = new FileService();
    await fileService.upload();

    const uploadedData = await fs.read(resolve(pathToExport, "settings.json"));
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

    await fs.write(resolve(pathToExport, "settings.json"), expected);

    const fileService = new FileService();
    await fileService.download();

    const downloadedData = await fs.read(resolve(pathToUser, "settings.json"));
    expect(downloadedData).toBe(expected);
  });
});
