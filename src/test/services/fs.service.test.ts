import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { FS, Settings } from "~/services";

jest.mock("~/services/localization.service.ts");
jest.mock("~/models/state.model.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/utility/fs.service");
const testFolder = `${cleanupPath}/test`;

beforeEach(() => Promise.all([ensureDir(testFolder)]));

afterEach(() => remove(cleanupPath));

Settings.get = jest.fn();

it("should not list ignored files", async () => {
  const filepath = resolve(testFolder, "file");
  await FS.write(filepath, "test");

  const files = await FS.listFiles(testFolder, ["**/file"]);

  expect(files.includes(filepath)).toBeFalsy();
});

it("should list files that aren't ignored", async () => {
  const filepath = resolve(testFolder, "file");
  await FS.write(filepath, "test");

  const files = await FS.listFiles(testFolder, ["**/fole"]);

  expect(files.includes(filepath)).toBeTruthy();
});
