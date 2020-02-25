import { resolve } from "path";
import { Uri } from "vscode";
import { CustomFiles, Environment, FS } from "~/services";
import { getCleanupPath } from "~/tests/getCleanupPath";
import { stringifyPretty } from "~/utilities";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("services/customFiles");

const pathToSource = resolve(cleanupPath, "source");
const pathToRegistered = resolve(cleanupPath, "registered");

const paths = [pathToSource, pathToRegistered];

jest
  .spyOn(Environment, "customFilesFolder", "get")
  .mockReturnValue(pathToRegistered);

beforeEach(() => Promise.all(paths.map(FS.mkdir)));

afterEach(() => FS.delete(cleanupPath));

test("register", async () => {
  const testPath = resolve(pathToSource, "test.json");

  const data = stringifyPretty({ test: true });
  await FS.write(testPath, data);

  const uri = {
    fsPath: testPath
  };

  await CustomFiles.register(uri as Uri);

  const exists = await FS.exists(resolve(pathToRegistered, "test.json"));
  expect(exists).toBeTruthy();
});
