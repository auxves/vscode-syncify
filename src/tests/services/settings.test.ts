import { tmpdir } from "os";
import { resolve } from "path";
import { defaultSettings, ISettings } from "~/models";
import { Environment, FS, Settings } from "~/services";

jest.mock("~/services/localization.ts");
jest.mock("~/utilities/confirm.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/settings");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

const pathToSettings = resolve(pathToTest, "settings.json");

jest.spyOn(Environment, "settings", "get").mockReturnValue(pathToSettings);
jest.spyOn(Environment, "globalStoragePath", "get").mockReturnValue(pathToTest);

beforeEach(() => Promise.all(paths.map(FS.mkdir)));

afterEach(() => FS.delete(cleanupPath));

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
