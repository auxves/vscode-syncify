import { migrate, Environment } from "~/services";
import state from "~/state";

function setPreviousVersion(version: string) {
	(state.context as any) = {};
	(state.context!.globalState as any) = {
		get: () => version,
		update: () => undefined,
	};
}

function setVersion(version: string) {
	Environment.version = version;
}

test("basic functionality", async () => {
	setPreviousVersion("1.0.0");
	setVersion("1.1.0");

	const fn = jest.fn();

	await migrate(new Map([["1.1.0", fn]]));

	expect(fn).toHaveBeenCalled();
});

test("range", async () => {
	{
		setPreviousVersion("1.0.0");
		setVersion("1.2.0");

		const fn = jest.fn();

		await migrate(new Map([[">= 1.1.0", fn]]));

		expect(fn).toHaveBeenCalled();
	}

	{
		setPreviousVersion("1.1.0");
		setVersion("1.2.0");

		const fn = jest.fn();

		await migrate(new Map([[">= 1.1.0", fn]]));

		expect(fn).not.toHaveBeenCalled();
	}
});

test("skip", async () => {
	setPreviousVersion("1.1.0");
	setVersion("1.2.0");

	const fn = jest.fn();

	await migrate(new Map([["1.1.0", fn]]));

	expect(fn).not.toHaveBeenCalled();
});

test("invalid", async () => {
	setPreviousVersion("1.1.0");
	setVersion("1.2.0");

	const fn = jest.fn();

	await migrate(new Map([["hello", fn]]));

	expect(fn).not.toHaveBeenCalled();
});

test("no context", async () => {
	state.context = undefined;

	const fn = jest.fn();

	await migrate(new Map([["0.0.0", fn]]));

	expect(fn).not.toHaveBeenCalled();
});
