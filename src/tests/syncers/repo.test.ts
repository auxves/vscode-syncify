import { resolve } from "path";
import createSimpleGit from "simple-git/promise";
import { window } from "vscode";
import { Environment, FS, localize, Profile, Settings } from "~/services";
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

  it("should not upload if up to date", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const spy = jest.spyOn(window, "setStatusBarMessage");

    await repoSyncer.upload();

    expect(spy).toHaveBeenCalledWith(
      localize("(info) repo -> remoteUpToDate"),
      2000
    );

    spy.mockRestore();
  });

  it("should upload binary files properly", async () => {
    await Settings.set(currentSettings);

    const pathToBuffer = resolve(pathToUser, "buffer");

    const buffer = Buffer.alloc(2).fill(1);

    await FS.write(pathToBuffer, buffer);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    const downloadedBuffer = await FS.read(
      resolve(pathToTmpRepo, "buffer"),
      true
    );

    expect(Buffer.compare(buffer, downloadedBuffer)).toBe(0);
  });
});

describe("download", () => {
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

  it("should create branch if first download", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    await new RepoSyncer().upload();

    await FS.delete(pathToRepo);

    await new RepoSyncer().download();

    const downloadedData = await FS.read(pathToSettings);

    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(userData);
  });

  it("shouldn't download if ahead of remote", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    await new RepoSyncer().download();

    const currentData = await FS.read(pathToSettings);
    expect(currentData).toBe(userData);
  });

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

  it("should download new profile properly", async () => {
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

    const newUserData = stringifyPretty({
      "test.key": 2
    });

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "test1", { "--force": null });

    await git.checkout(["-b", "test2"]);

    await FS.write(resolve(pathToTmpRepo, "settings.json"), newUserData);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "test2");

    await Profile.switch("test2");

    await repoSyncer.download();

    const downloadedData = await FS.read(pathToSettings);

    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(newUserData);
  });

  it("should not upload if up to date", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const spy = jest.spyOn(window, "setStatusBarMessage");

    await repoSyncer.download();

    expect(spy).toHaveBeenCalledWith(localize("(info) repo -> upToDate"), 2000);

    spy.mockRestore();
  });

  it("should merge if changes exist", async () => {
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

    const keybindings = stringifyPretty([1, 2, 3]);
    const pathToKeybindings = resolve(pathToUser, "keybindings.json");

    await FS.write(pathToKeybindings, keybindings);

    await repoSyncer.download();

    const downloadedData = await FS.read(pathToSettings);
    expect(downloadedData.replace(/\r\n/g, "\n")).toBe(expected);

    const keybindingsData = await FS.read(pathToKeybindings);
    expect(keybindingsData.replace(/\r\n/g, "\n")).toBe(keybindings);
  });

  it("should download binary files properly", async () => {
    await Settings.set(currentSettings);

    const pathToBuffer = resolve(pathToUser, "buffer");

    await FS.write(pathToBuffer, Buffer.alloc(2).fill(0));

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const git = createSimpleGit(pathToTmpRepo);
    await git.init();
    await git.addRemote("origin", pathToRemote);
    await git.pull("origin", "master", { "--force": null });

    const buffer = Buffer.alloc(2).fill(1);

    await FS.write(resolve(pathToTmpRepo, "buffer"), buffer);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoSyncer.download();

    const downloadedBuffer = await FS.read(pathToBuffer, true);

    expect(Buffer.compare(buffer, downloadedBuffer)).toBe(0);
  });
});

describe("sync", () => {
  it("should upload if changes exist and not behind", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const newUserData = stringifyPretty({
      "test.key": false
    });

    await FS.write(pathToSettings, newUserData);

    const spy = jest.spyOn(repoSyncer, "upload");

    await repoSyncer.sync();

    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it("should not do anything if no changes and not behind", async () => {
    await Settings.set(currentSettings);

    const userData = stringifyPretty({
      "test.key": true
    });

    await FS.write(pathToSettings, userData);

    const repoSyncer = new RepoSyncer();
    await repoSyncer.upload();

    const uploadSpy = jest.spyOn(repoSyncer, "upload");
    const downloadSpy = jest.spyOn(repoSyncer, "download");

    await repoSyncer.sync();

    expect(uploadSpy).not.toHaveBeenCalled();
    expect(downloadSpy).not.toHaveBeenCalled();

    uploadSpy.mockRestore();
    downloadSpy.mockRestore();
  });

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

    await new RepoSyncer().init();

    const git = createSimpleGit(pathToRepo);

    expect(await git.checkIsRepo()).toBeTruthy();

    const remotes = await git.getRemotes(true);

    expect(remotes[0].name).toBe("origin");
    expect(remotes[0].refs.push).toBe(pathToRemote);
  });

  it("should update remote if not correct", async () => {
    const git = createSimpleGit(pathToRepo);

    await git.init();
    await git.addRemote("origin", "test");

    await Settings.set(currentSettings);

    await new RepoSyncer().init();

    const remotes = await git.getRemotes(true);

    expect(remotes[0].name).toBe("origin");
    expect(remotes[0].refs.push).toBe(pathToRemote);
  });
});
