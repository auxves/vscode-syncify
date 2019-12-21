import { resolve } from "path";
import createSimpleGit from "simple-git/promise";
import { Environment, FS, Profile, Settings } from "~/services";
import { RepoSyncer } from "~/syncers";
import { getCleanupPath } from "~/tests/getCleanupPath";
import { merge, stringifyPretty } from "~/utilities";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("syncers/repo");

const pathToRemote = resolve(cleanupPath, "remote");
const pathToRepo = resolve(cleanupPath, "repo");
const pathToTmpRepo = resolve(cleanupPath, "tmpRepo");
const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStoragePath = resolve(cleanupPath, "globalStoragePath");

const paths = [
  pathToRemote,
  pathToRepo,
  pathToTmpRepo,
  pathToUser,
  pathToGlobalStoragePath
];

const pathToSettings = resolve(pathToUser, "settings.json");

jest.spyOn(Environment, "userFolder", "get").mockReturnValue(pathToUser);
jest.spyOn(Environment, "repoFolder", "get").mockReturnValue(pathToRepo);

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(pathToGlobalStoragePath);

jest.setTimeout(15000);

const currentSettings = {
  repo: {
    url: pathToRemote
  }
};

beforeEach(async () => {
  await Promise.all(paths.map(FS.mkdir));
  return createSimpleGit(pathToRemote).init(true);
});

afterEach(() => FS.delete(cleanupPath));

describe("upload", () => {
  it("should upload", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const uploadedData = await FS.read(pathToSettings);
    expect(uploadedData).toBe(userData);
  });

  it("shouldn't upload if behind remote", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = stringifyPretty({
      "test.key": false
    });

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
    await Settings.set(currentSettings);

    const expected = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, expected);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const exists = await FS.exists(resolve(pathToRepo, "workspaceStorage"));
    expect(exists).toBeFalsy();

    const settingsData = await FS.read(pathToSettings);
    expect(settingsData).toBe(expected);
  });
});

describe("download", () => {
  it("should switch profiles properly", async () => {
    await Settings.set(
      merge(currentSettings, {
        repo: {
          profiles: [
            { branch: "test1", name: "test1" },
            { branch: "test2", name: "test2" }
          ],
          currentProfile: "test1"
        }
      })
    );

    const userData = stringifyPretty({
      "test.key": 1
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    await Profile.switch("test2");

    const newUserData = stringifyPretty({
      "test.key": 2
    });

    await FS.write(pathToSettings, newUserData);

    await repoSyncer.upload();
    await Profile.switch("test1");
    await repoSyncer.download();

    const downloadedData = await FS.read(pathToSettings);

    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(userData);
  });

  it("should download", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = stringifyPretty({
      "test.key": false
    });

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    await FS.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.download();

    const downloadedData = await FS.read(pathToSettings);

    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(expected);
  });

  it("shouldn't download if ahead of remote", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.download();

    const currentData = await FS.read(pathToSettings);
    expect(currentData).toBe(userData);
  });
});

describe("sync", () => {
  it("should download if behind remote", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const expected = stringifyPretty({
      "test.key": false
    });

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    await FS.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.sync();

    const syncedData = await FS.read(pathToSettings);
    expect(syncedData.replace(/\r\n/g, "\n")).toBe(expected);
  });
});

describe("init", () => {
  it("should initialize", async () => {
    await Settings.set(currentSettings);

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
