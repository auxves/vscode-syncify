import { confirm } from "~/utilities";
import { window } from "vscode";

jest.mock("~/services/localize.ts");

test("yes", async () => {
	const spy = jest.spyOn(window, "showWarningMessage");

	spy.mockImplementationOnce(() => "(label) yes" as any);

	const result = await confirm("test");

	expect(result).toBeTruthy();

	spy.mockRestore();
});

test("no", async () => {
	const spy = jest.spyOn(window, "showWarningMessage");

	{
		spy.mockImplementationOnce(() => "(label) no" as any);

		const result = await confirm("test");

		expect(result).toBeFalsy();
	}

	{
		spy.mockImplementationOnce(() => undefined as any);

		const result = await confirm("test");

		expect(result).toBeFalsy();
	}

	spy.mockRestore();
});
