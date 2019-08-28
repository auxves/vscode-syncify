import { CustomFileService, EnvironmentService, FS } from "@/services";
import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { Uri } from "vscode";

jest.mock("@/services/utility/localization.service.ts");
jest.mock("@/models/state.model.ts");

const cleanupPath = resolve(
  tmpdir(),
  "syncify-jest/utility/custom-file.service"
);
const pathToSource = `${cleanupPath}/source`;
const pathToRegistered = `${cleanupPath}/registered`;

Object.defineProperty(EnvironmentService, "customFilesFolder", {
  get: () => pathToRegistered
});

beforeEach(async () => {
  return Promise.all([ensureDir(pathToSource)]);
});

afterEach(() => {
  return remove(cleanupPath);
});

it("should register a provided file", async () => {
  const data = JSON.stringify({ test: true }, null, 2);
  await FS.write(resolve(pathToSource, "test.json"), data);

  const uri = {
    fsPath: resolve(pathToSource, "test.json")
  };

  await CustomFileService.register(uri as Uri);

  const exists = await FS.exists(resolve(pathToRegistered, "test.json"));
  expect(exists).toBeTruthy();
});
