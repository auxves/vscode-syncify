import { migrate, Environment } from "~/services";
import state from "~/state";

function setPreviousVersion(version: string) {
	(state.context as any) = {};
	(state.context!.globalState as any) = {
		get: () => version,
		update: () => null
	};
}

function setVersion(version: string) {
	Environment.version = version;
}

test("basic functionality", async () => {
	setPreviousVersion("1.0.0");
	setVersion("1.1.0");

	const fn = jest.fn();

	await migrate({
		"1.1.0": fn
	});

	expect(fn).toBeCalled();
});

test("range", async () => {
	{
		setPreviousVersion("1.0.0");
		setVersion("1.2.0");

		const fn = jest.fn();

		await migrate({
			">= 1.1.0": fn
		});

		expect(fn).toBeCalled();
	}

	{
		setPreviousVersion("1.1.0");
		setVersion("1.2.0");

		const fn = jest.fn();

		await migrate({
			">= 1.1.0": fn
		});

		expect(fn).not.toBeCalled();
	}
});

test("skip", async () => {
	setPreviousVersion("1.1.0");
	setVersion("1.2.0");

	const fn = jest.fn();

	await migrate({
		"1.1.0": fn
	});

	expect(fn).not.toBeCalled();
});

test("invalid", async () => {
	setPreviousVersion("1.1.0");
	setVersion("1.2.0");

	const fn = jest.fn();

	await migrate({
		hello: fn
	});

	expect(fn).not.toBeCalled();
});

test("no context", async () => {
	state.context = undefined;

	const fn = jest.fn();

	await migrate({
		"0.0.0": fn
	});

	expect(fn).not.toBeCalled();
});
