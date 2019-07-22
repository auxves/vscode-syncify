import { ensureDir, remove } from "fs-extra";
import { resolve } from "path";
import createSimpleGit from "simple-git/promise";
import { state } from "../../../models/state.model";
import { RepoService } from "../../../services/sync/repo.service";
import { FileSystemService } from "../../../services/utility/fs.service";

const fs = new FileSystemService();

jest.mock("../../../services/utility/localization.service.ts");
jest.mock("../../../models/state.model.ts");

const cleanupPath = "/tmp/jest/repo.service.test.ts";
const pathToRemote = `${cleanupPath}/remote`;
const pathToRepo = `${cleanupPath}/repo`;
const pathToTmpRepo = `${cleanupPath}/tmpRepo`;
const pathToUser = `${cleanupPath}/user`;

state.env.locations = {
  ...state.env.locations,
  repoFolder: pathToRepo,
  userFolder: pathToUser
};

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

    const repoService = new RepoService();
    await repoService.upload();

    const uploadedData = await fs.read(resolve(pathToRepo, "settings.json"));
    expect(uploadedData).toBe(expected);
  });

  it("shouldn't upload if behind remote", async () => {
    const userData = {
      "test.key": true
    };
    await fs.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoService = new RepoService();
    await repoService.upload();

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

    await fs.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoService.upload();

    await git.pull("origin", "master", { "--force": null });

    const syncedData = await fs.read(resolve(pathToTmpRepo, "settings.json"));
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

    await fs.write(resolve(pathToUser, "settings.json"), expected);

    const repoService = new RepoService();
    await repoService.upload();

    const exists = await fs.exists(resolve(pathToRepo, "workspaceStorage"));
    expect(exists).toBeFalsy();

    const settingsData = await fs.read(resolve(pathToUser, "settings.json"));
    expect(settingsData).toBe(expected);
  });
});

describe("download", () => {
  it("should download", async () => {
    const userData = {
      "test.key": true
    };
    await fs.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoService = new RepoService();
    await repoService.upload();

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

    await fs.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoService.download();

    const downloadedData = await fs.read(resolve(pathToUser, "settings.json"));
    expect(downloadedData).toBe(expected);
  });

  it("shouldn't download if ahead of remote", async () => {
    const userData = {
      "test.key": true
    };

    const expected = JSON.stringify(userData, null, 2);

    await fs.write(resolve(pathToUser, "settings.json"), expected);

    const repoService = new RepoService();
    await repoService.download();

    const currentData = await fs.read(resolve(pathToUser, "settings.json"));
    expect(currentData).toBe(expected);
  });
});

describe("sync", () => {
  it("should download if behind remote", async () => {
    const userData = {
      "test.key": true
    };
    await fs.write(
      resolve(pathToUser, "settings.json"),
      JSON.stringify(userData, null, 2)
    );

    const repoService = new RepoService();
    await repoService.upload();

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

    await fs.write(resolve(pathToTmpRepo, "settings.json"), expected);

    await git.add(".");
    await git.commit("Testing");
    await git.push("origin", "master", { "--force": null });

    await repoService.sync();

    const syncedData = await fs.read(resolve(pathToUser, "settings.json"));
    expect(syncedData).toBe(expected);
  });
});

describe("init", () => {
  it("should initialize", async () => {
    const repoService = new RepoService();
    await repoService.init();

    const git = createSimpleGit(pathToRepo);
    const isRepo = await git.checkIsRepo();
    expect(isRepo).toBeTruthy();

    const remotes = await git.getRemotes(true);
    expect(remotes[0].name).toBe("origin");
    expect(remotes[0].refs.push).toBe(pathToRemote);

    const gitignoreExists = await fs.exists(resolve(pathToRepo, ".gitignore"));
    expect(gitignoreExists).toBeTruthy();
  });
});
