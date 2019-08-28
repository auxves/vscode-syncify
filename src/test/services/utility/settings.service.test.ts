import { defaultSettings, ISettings } from "@/models";
import {
  EnvironmentService,
  FS,
  InitService,
  SettingsService
} from "@/services";
import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/utility/settings.service");
const testFolder = `${cleanupPath}/test`;

jest
  .spyOn(EnvironmentService, "settings", "get")
  .mockReturnValue(resolve(testFolder, "settings.json"));

InitService.init = jest.fn();

beforeEach(async () => {
  return Promise.all([ensureDir(testFolder)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

it("should set settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await SettingsService.setSettings(newSettings);

  const fetched: ISettings = JSON.parse(
    await FS.read(EnvironmentService.settings)
  );

  expect(fetched.watchSettings).toBeTruthy();
});

it("should get settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await FS.write(EnvironmentService.settings, JSON.stringify(newSettings));

  const fetched = await SettingsService.getSettings();

  expect(fetched.watchSettings).toBeTruthy();
});
