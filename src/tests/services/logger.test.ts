import { Logger } from "~/services";
import state from "~/state";

test("error", async () => {
	const errorSpy = jest.spyOn(console, "error");

	errorSpy.mockImplementation(() => undefined as any);

	const error = new Error("Hi");

	await Logger.error(error);

	expect(errorSpy).toHaveBeenCalledWith(error);

	errorSpy.mockRestore();
});

test("debug", () => {
	const logSpy = jest.spyOn(console, "log");
	logSpy.mockImplementation(() => undefined as any);

	// Debug Mode On

	state.isDebugMode = true;

	Logger.debug("5");

	expect(logSpy).toHaveBeenCalledWith("🐛", "5");

	logSpy.mockClear();

	// Debug Mode Off

	state.isDebugMode = false;

	Logger.debug();

	expect(logSpy).not.toHaveBeenCalled();

	logSpy.mockClear();

	logSpy.mockRestore();
});
