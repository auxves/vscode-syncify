import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { Uri } from "vscode";
import { CustomFiles, Environment, FS } from "~/services";

jest.mock("~/services/localization.ts");
jest.mock("~/models/state.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/custom-file");
const pathToSource = `${cleanupPath}/source`;
const pathToRegistered = `${cleanupPath}/registered`;

Object.defineProperty(Environment, "customFilesFolder", {
  get: () => pathToRegistered
});

beforeEach(async () => Promise.all([ensureDir(pathToSource)]));

afterEach(() => remove(cleanupPath));

it("should register a provided file", async () => {
  const data = JSON.stringify({ test: true }, null, 2);
  await FS.write(resolve(pathToSource, "test.json"), data);

  const uri = {
    fsPath: resolve(pathToSource, "test.json")
  };

  await CustomFiles.register(uri as Uri);

  const exists = await FS.exists(resolve(pathToRegistered, "test.json"));
  expect(exists).toBeTruthy();
});
