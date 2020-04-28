import { extensions, Uri, commands } from "vscode";
import { Extensions, Environment, FS } from "~/services";
import { getCleanupPath } from "~/tests/getCleanupPath";
import { resolve } from "path";

function setExtensions(exts: string[]): void {
	(extensions.all as any) = exts.map(ext => ({
		id: ext,
		packageJSON: { isBuiltin: false },
		extensionPath: "",
		isActive: false,
		exports: undefined,
		activate: async () => Promise.resolve()
	}));
}

const cleanupPath = getCleanupPath("services/extensions");

const pathToVsix = resolve(cleanupPath, "vsix");

jest.spyOn(Environment, "vsixFolder", "get").mockReturnValue(pathToVsix);

test("missing extensions", () => {
	setExtensions(["publisher1.extension1"]);

	const missing = Extensions.getMissing([
		"publisher1.extension1",
		"publisher2.extension2",
		"publisher3.extension3"
	]);

	expect(missing).toMatchSnapshot();
});

test("unneeded extensions", () => {
	setExtensions([
		"publisher1.extension1",
		"publisher2.extension2",
		"publisher3.extension3"
	]);

	const unneeded = Extensions.getUnneeded(["publisher1.extension1"]);

	expect(unneeded).toMatchSnapshot();
});

describe("install", () => {
	test("marketplace", async () => {
		const spy = jest.spyOn(commands, "executeCommand");

		await Extensions.install("test.extension");

		expect(spy).toHaveBeenCalledWith(
			"workbench.extensions.installExtension",
			"test.extension"
		);

		spy.mockRestore();
	});

	test("vsix", async () => {
		await FS.mkdir(pathToVsix);

		const spy = jest.spyOn(commands, "executeCommand");

		await FS.write(resolve(pathToVsix, "test.extension.vsix"), "test");

		await Extensions.install("test.extension");

		expect(spy).toHaveBeenCalledWith(
			"workbench.extensions.installExtension",
			Uri.file("")
		);

		spy.mockRestore();

		await FS.remove(pathToVsix);
	});
});

test("uninstall", async () => {
	const spy = jest.spyOn(commands, "executeCommand");

	await Extensions.uninstall("test.extension");

	expect(spy).toHaveBeenCalledWith(
		"workbench.extensions.uninstallExtension",
		"test.extension"
	);

	spy.mockRestore();
});
