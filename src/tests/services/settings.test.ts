import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { defaultSettings, ISettings } from "~/models";
import { Environment, FS, Initializer, Settings } from "~/services";

jest.mock("~/services/localization.ts");
jest.mock("~/utilities/confirm.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/settings");
const testFolder = `${cleanupPath}/test`;

jest
  .spyOn(Environment, "settings", "get")
  .mockReturnValue(resolve(testFolder, "settings.json"));

jest
  .spyOn(Environment, "globalStoragePath", "get")
  .mockReturnValue(resolve(testFolder));

Initializer.init = jest.fn();

beforeEach(() => Promise.all([ensureDir(testFolder)]));

afterEach(() => remove(cleanupPath));

it("should set settings", async () => {
  await Settings.set({ watchSettings: true });

  const fetched: ISettings = JSON.parse(await FS.read(Environment.settings));

  expect(fetched.watchSettings).toBeTruthy();
});

it("should get settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await FS.write(Environment.settings, JSON.stringify(newSettings));

  const watchSettings = await Settings.get(s => s.watchSettings);

  expect(watchSettings).toBeTruthy();
});

it("should get settings w/o side effects", async () => {
  expect(await Settings.get()).toStrictEqual(defaultSettings);
});

it("should delete settings during reset", async () => {
  await Settings.set({ watchSettings: true });

  await Settings.reset();

  const exists = await FS.exists(Environment.settings);

  expect(exists).toBeFalsy();
});
