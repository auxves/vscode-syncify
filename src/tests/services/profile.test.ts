import { resolve } from "path";
import { Environment, FS, Profiles, Settings } from "~/services";
import { getCleanupPath } from "~/tests/get-cleanup-path";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("services/profile");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

jest
	.spyOn(Environment, "localSettings")
	.mockReturnValue(resolve(pathToTest, "settings.json"));

jest
	.spyOn(Environment, "sharedSettings")
	.mockReturnValue(Promise.resolve(resolve(pathToTest, "syncify.json")));

beforeEach(async () => Promise.all(paths.map(async (path) => FS.mkdir(path))));

afterEach(async () => FS.remove(cleanupPath));

test("switch", async () => {
	await Settings.local.set({
		syncer: "git",
		currentProfile: "1",
	});

	await Settings.shared.set({
		profiles: [
			{ name: "1", extensions: [] },
			{ name: "2", extensions: [] },
		],
	});

	await Profiles.switchProfile("2");

	const { currentProfile } = await Settings.local.get();

	expect(currentProfile).toBe("2");
});
