import { Pragma, Environment } from "~/services";

test("outgoing", () => {
	const initial = `{
		// @sync ...
		"key": "value",

		// @invalid
		"key2": "value2"
	}`;

	const result = Pragma.outgoing(initial);

	expect(result).toMatchSnapshot();
});

describe("incoming", () => {
	test("operating system", () => {
		const spy = jest.spyOn(Environment, "os", "get");

		const testOS = (os: string): void => {
			spy.mockReturnValueOnce("windows");

			const initial = `{
				// @sync os=${os}
				// "key": "value"
			}`;

			const result = Pragma.incoming(initial);

			expect(result).toMatchSnapshot();
		};

		testOS("windows");
		testOS("mac");
		testOS("linux");

		spy.mockRestore();
	});

	test("host", () => {
		const validHostname = "pc";

		const testHostname = (hostname: string): void => {
			const initial = `{
				// @sync host=${hostname}
				// "key": "value"
			}`;

			const result = Pragma.incoming(initial, validHostname);

			expect(result).toMatchSnapshot();
		};

		testHostname(validHostname);
		testHostname("invalid");
	});

	test("env", () => {
		const testEnv = (value?: string): void => {
			if (value) process.env.ENV_TEST_KEY = value;

			const initial = `{
				// @sync env=ENV_TEST_KEY
				// "key": "value"
			}`;

			const result = Pragma.incoming(initial);

			expect(result).toMatchSnapshot();

			delete process.env.ENV_TEST_KEY;
		};

		testEnv();
		testEnv("value");
	});
});
