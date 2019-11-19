import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import createSimpleGit from "simple-git/promise";
import { defaultSettings, Syncer } from "~/models";
import { Environment, FS, Settings } from "~/services";
import { RepoSyncer } from "~/syncers";

jest.mock("~/services/localization.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/syncers/repo");
const pathToRemote = `${cleanupPath}/remote`;
const pathToRepo = `${cleanupPath}/repo`;
const pathToTmpRepo = `${cleanupPath}/tmpRepo`;
const pathToUser = `${cleanupPath}/user`;
const pathToGlobalStoragePath = `${cleanupPath}/globalStoragePath`;

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);
jest.spyOn(Environment, "repoFolder", "get").mockReturnValue(pathToRepo);

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(pathToGlobalStoragePath);

jest.setTimeout(15000);

const currentSettings = {
  ...defaultSettings,
  syncer: Syncer.Repo,
  repo: {
    url: pathToRemote,
    profiles: [
      {
        branch: "master",
        name: "main"
      }
    ],
    currentProfile: "main"
  },
  hostname: "jest"
};

Settings.get = jest
  .fn()
  .mockImplementation(async (selector: any) =>
    selector ? selector(currentSettings) : currentSettings
  );

beforeEach(async () => {
  await Promise.all([
    ensureDir(pathToRemote),
    ensureDir(pathToRepo),
    ensureDir(pathToTmpRepo),
    ensureDir(pathToUser)
  ]);
  const git = createSimpleGit(pathToRemote);
  return git.init(true);
});

afterEach(() => remove(cleanupPath));

describe("upload", () => {
  it("should upload", async () => {
    const userData = {
      "test.key": true
    };
    const expected = JSON.stringify(userData, null, 2);
    await FS.write(resolve(pathToUser, "settings.json"), expected);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const uploadedData = await FS.read(resolve(pathToRepo, "settings.json"));
    expect(uploadedData).toBe(expected);
  });

  it("shouldn't upload if behind remote", async () => {
    const userData = {
      "test.key": true
    };
    await FS.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = JSON.stringify(
      {
        "test.key": false
      },
      null,
      2
    );

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    await FS.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.upload();

    await git.pull("origin", "master", { "--force": null });

    const syncedData = await FS.read(resolve(pathToTmpRepo, "settings.json"));
    expect(syncedData).toBe(expected);
  });

  it("should properly ignore items", async () => {
    const expected = JSON.stringify(
      {
        "test.key": true
      },
      null,
      2
    );

    await FS.write(resolve(pathToUser, "settings.json"), expected);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const exists = await FS.exists(resolve(pathToRepo, "workspaceStorage"));
    expect(exists).toBeFalsy();

    const settingsData = await FS.read(resolve(pathToUser, "settings.json"));
    expect(settingsData).toBe(expected);
  });
});

describe("download", () => {
  it("should download", async () => {
    const userData = {
      "test.key": true
    };
    await FS.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = JSON.stringify(
      {
        "test.key": false
      },
      null,
      2
    );

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    await FS.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.download();

    const downloadedData = await FS.read(resolve(pathToUser, "settings.json"));

    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(expected);
  });

  it("shouldn't download if ahead of remote", async () => {
    const userData = {
      "test.key": true
    };

    const expected = JSON.stringify(userData, null, 2);

    await FS.write(resolve(pathToUser, "settings.json"), expected);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.download();

    const currentData = await FS.read(resolve(pathToUser, "settings.json"));
    expect(currentData).toBe(expected);
  });
});

describe("sync", () => {
  it("should download if behind remote", async () => {
    const userData = {
      "test.key": true
    };
    await FS.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = JSON.stringify(
      {
        "test.key": false
      },
      null,
      2
    );

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    await FS.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.sync();

    const syncedData = await FS.read(resolve(pathToUser, "settings.json"));
    expect(syncedData.replace(/\r\n/g, "\n")).toBe(expected);
  });
});

describe("init", () => {
  it("should initialize", async () => {
    const repoSyncer = new RepoSyncer();
    await repoSyncer.init();

    const git = createSimpleGit(pathToRepo);
    const isRepo = await git.checkIsRepo();
    expect(isRepo).toBeTruthy();

    const remotes = await git.getRemotes(true);
    expect(remotes[0].name).toBe("origin");
    expect(remotes[0].refs.push).toBe(pathToRemote);
  });
});
