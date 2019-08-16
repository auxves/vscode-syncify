import { state } from "@/models";
import { CustomFileService, FileSystemService } from "@/services";
import { ensureDir, remove } from "fs-extra";
import { resolve } from "path";
import { Uri } from "vscode";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const fs = new FileSystemService();

const cleanupPath = "/tmp/jest/custom-file.service.test.ts";
const pathToSource = `${cleanupPath}/source`;
const pathToRegistered = `${cleanupPath}/registered`;

beforeEach(async () => {
  return Promise.all([ensureDir(pathToSource)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

state.env.locations = {
  ...state.env.locations,
  customFilesFolder: pathToRegistered
};

it("should register a provided file", async () => {
  const data = JSON.stringify({ test: true }, null, 2);
  await fs.write(resolve(pathToSource, "test.json"), data);

  const uri = {
    fsPath: resolve(pathToSource, "test.json")
  };

  await CustomFileService.register(uri as Uri);

  const exists = await fs.exists(resolve(pathToRegistered, "test.json"));
  expect(exists).toBeTruthy();
});
