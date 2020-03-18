import { initLocalization, localize, FS, Environment } from "~/services";
import { resolve } from "path";
import { getCleanupPath } from "~/tests/getCleanupPath";
import { stringifyPretty } from "~/utilities";

test("language detection", async () => {
	const spy = jest.spyOn(FS, "exists");

	{
		const spy = jest.spyOn(FS, "exists");

		process.env.VSCODE_NLS_CONFIG = JSON.stringify({ locale: "fake-locale" });

		await initLocalization();

		delete process.env.VSCODE_NLS_CONFIG;

		const expected = resolve(
			Environment.extensionPath,
			`package.nls.fake-locale.json`
		);

		expect(spy).toHaveBeenCalledWith(expected);

		spy.mockClear();
	}

	{
		await initLocalization();

		const expected = resolve(
			Environment.extensionPath,
			`package.nls.en-us.json`
		);

		expect(spy).toHaveBeenCalledWith(expected);

		spy.mockClear();
	}

	spy.mockRestore();
});

test("returns requested language pack", async () => {
	const cleanupPath = getCleanupPath("services/localize");

	const spy = jest
		.spyOn(Environment, "extensionPath", "get")
		.mockReturnValueOnce(cleanupPath);

	await FS.mkdir(cleanupPath);

	await FS.write(
		resolve(cleanupPath, "package.nls.lang.json"),
		stringifyPretty({
			key: "value"
		})
	);

	await initLocalization("lang");

	expect(localize("key")).toBe("value");

	await FS.remove(cleanupPath);

	spy.mockRestore();
});

test("basic functionality", async () => {
	await initLocalization("en-us");

	expect(localize("(info) extensions -> installed", "5")).toMatchSnapshot();
	expect(localize("(info) extensions -> uninstalled", "10")).toMatchSnapshot();
});

test("invalid key", async () => {
	await initLocalization("en-us");

	expect(localize("")).toBe("");

	const rand = Math.random().toString();

	expect(localize(rand)).toBe(rand);
});
