import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { defaultSettings, ISettings } from "~/models";
import { Environment, FS, Initializer, Settings } from "~/services";

jest.mock("~/services/localization.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/settings");
const testFolder = `${cleanupPath}/test`;

jest
  .spyOn(Environment, "settings", "get")
  .mockReturnValue(resolve(testFolder, "settings.json"));

Initializer.init = jest.fn();

beforeEach(() => Promise.all([ensureDir(testFolder)]));

afterEach(() => remove(cleanupPath));

it("should set settings", async () => {
  await FS.write(Environment.settings, JSON.stringify(defaultSettings));

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

  const fetched = await Settings.get();

  expect(fetched.watchSettings).toBeTruthy();
});

it("should get settings w/o side effects", async () => {
  expect(await Settings.get()).toStrictEqual(defaultSettings);
});
