import { resolve } from "path";
import { Uri } from "vscode";
import { CustomFiles, Environment, FS } from "~/services";
import { getCleanupPath } from "~/tests/get-cleanup-path";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("services/custom-files");

const pathToSource = resolve(cleanupPath, "source");
const pathToRegistered = resolve(cleanupPath, "registered");

const paths = [pathToSource, pathToRegistered];

jest
	.spyOn(Environment, "customFilesFolder")
	.mockReturnValue(Promise.resolve(pathToRegistered));

beforeEach(async () => Promise.all(paths.map(async (path) => FS.mkdir(path))));

afterEach(async () => FS.remove(cleanupPath));

test("register", async () => {
	const testPath = resolve(pathToSource, "test.json");

	const data = JSON.stringify({ test: true });
	await FS.write(testPath, data);

	const uri = { fsPath: testPath };

	await CustomFiles.registerFile(uri as Uri);

	const exists = await FS.exists(resolve(pathToRegistered, "test.json"));
	expect(exists).toBeTruthy();
});
