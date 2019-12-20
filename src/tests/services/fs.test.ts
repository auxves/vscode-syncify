import { tmpdir } from "os";
import { resolve } from "path";
import { FS, Settings } from "~/services";

jest.mock("~/services/localization.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/fs");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

beforeEach(() => Promise.all(paths.map(FS.mkdir)));

afterEach(() => FS.delete(cleanupPath));

it("should not list ignored files", async () => {
  const filepath = resolve(pathToTest, "file");
  await FS.write(filepath, "test");

  const files = await FS.listFiles(pathToTest, ["**/file"]);

  expect(files.includes(filepath)).toBeFalsy();
});

it("should list files that aren't ignored", async () => {
  const filepath = resolve(pathToTest, "file");
  await FS.write(filepath, "test");

  const files = await FS.listFiles(pathToTest, ["**/fole"]);

  expect(files.includes(filepath)).toBeTruthy();
});
