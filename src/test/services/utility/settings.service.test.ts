import { defaultSettings, ISettings } from "@/models";
import { Environment, FS, InitService, Settings } from "@/services";
import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/utility/settings.service");
const testFolder = `${cleanupPath}/test`;

jest
  .spyOn(Environment, "settings", "get")
  .mockReturnValue(resolve(testFolder, "settings.json"));

InitService.init = jest.fn();

beforeEach(() => Promise.all([ensureDir(testFolder)]));

afterEach(() => remove(cleanupPath));

it("should set settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await Settings.set(newSettings);

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
