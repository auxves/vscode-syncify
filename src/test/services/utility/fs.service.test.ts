import { ensureDir, remove } from "fs-extra";
import { resolve } from "path";
import { FileSystemService } from "../../../services/utility/fs.service";

jest.mock("../../../services/utility/localization.service.ts");
jest.mock("../../../models/state.model.ts");

const fs = new FileSystemService();

const cleanupPath = "/tmp/jest/fs.service.test.ts";
const testFolder = `${cleanupPath}/test`;

beforeEach(async () => {
  return Promise.all([ensureDir(testFolder)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

it("should only list files that aren't ignored", async () => {
  const filepath = resolve(testFolder, "file");
  await fs.write(filepath, "test");

  const files = await fs.listFiles(testFolder, ["**/file"]);

  expect(files.includes(filepath)).toBeFalsy();
});
