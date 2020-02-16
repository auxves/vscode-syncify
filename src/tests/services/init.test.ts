import { resolve } from "path";
import { commands } from "vscode";
import { Environment, FS, init, Settings, Watcher } from "~/services";
import state from "~/state";
import { getCleanupPath } from "~/tests/getCleanupPath";

const cleanupPath = getCleanupPath("services/init");

const pathToUser = resolve(cleanupPath, "user");
const pathToGlobalStoragePath = resolve(cleanupPath, "user");

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(pathToGlobalStoragePath);

const paths = [pathToUser, pathToGlobalStoragePath];

beforeEach(() => {
  (state.context as any) = {
    subscriptions: []
  };

  return Promise.all(paths.map(FS.mkdir));
});

afterEach(() => {
  state.context = undefined;

  return FS.delete(cleanupPath);
});

jest.mock("~/services/localize.ts");

it("should register commands", async () => {
  const spy = jest.spyOn(commands, "registerCommand");

  await init();

  expect(spy).toBeCalled();

  spy.mockRestore();
});

it("should start watching", async () => {
  await Settings.set({ watchSettings: true });

  const spy = jest.spyOn(Watcher, "start");

  await init();

  expect(spy).toBeCalled();

  spy.mockRestore();
});

it("should start syncing", async () => {
  await Settings.set({ syncOnStartup: true });

  const spy = jest.spyOn(commands, "executeCommand");

  await init();

  expect(spy).toBeCalledWith("syncify.sync");

  spy.mockRestore();
});
