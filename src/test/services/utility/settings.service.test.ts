import { ensureDir, remove } from "fs-extra";
import { resolve } from "path";
import { defaultSettings, ISettings } from "../../../models/settings.model";
import { state } from "../../../models/state.model";
import { FileSystemService } from "../../../services/utility/fs.service";
import { InitService } from "../../../services/utility/init.service";
import { SettingsService } from "../../../services/utility/settings.service";

jest.mock("../../../services/utility/localization.service.ts");
jest.mock("../../../models/state.model.ts");

const cleanupPath = "/tmp/jest/settings.service.test.ts";
const testFolder = `${cleanupPath}/test`;

const settings = new SettingsService();
const fs = new FileSystemService();

InitService.init = jest.fn();

beforeEach(async () => {
  return Promise.all([ensureDir(testFolder)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

state.env.locations = {
  ...state.env.locations,
  settings: resolve(testFolder, "settings.json")
};

state.context = {
  ...state.context,
  globalStoragePath: testFolder
};

it("should set settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await settings.setSettings(newSettings);

  const fetched: ISettings = JSON.parse(
    await fs.read(state.env.locations.settings)
  );

  expect(fetched.watchSettings).toBeTruthy();
});

it("should get settings", async () => {
  const newSettings: ISettings = {
    ...defaultSettings,
    watchSettings: true
  };

  await fs.write(state.env.locations.settings, JSON.stringify(newSettings));

  const fetched = await settings.getSettings();

  expect(fetched.watchSettings).toBeTruthy();
});
