import { SyncMethod } from "@/models";
import {
  EnvironmentService,
  FileService,
  FS,
  SettingsService
} from "@/services";
import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/sync/file.service");
const pathToExport = `${cleanupPath}/export`;
const pathToUser = `${cleanupPath}/user`;

jest.spyOn(EnvironmentService, "userFolder", "get").mockReturnValue(pathToUser);

SettingsService.getSettings = jest.fn(() =>
  Promise.resolve({
    method: SyncMethod.Repo,
    repo: {
      url: "",
      profiles: [
        {
          branch: "master",
          name: "main"
        }
      ],
      currentProfile: "main"
    },
    file: {
      path: pathToExport
    },
    github: {
      token: "",
      endpoint: "https://github.com",
      user: ""
    },
    ignoredItems: [
      "**/workspaceStorage",
      "**/globalStorage/state.vscdb*",
      "**/globalStorage/arnohovhannisyan.syncify",
      "**/.git"
    ],
    autoUploadDelay: 20,
    watchSettings: false,
    removeExtensions: true,
    syncOnStartup: false,
    hostname: "jest",
    forceDownload: false,
    forceUpload: false
  })
);

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
