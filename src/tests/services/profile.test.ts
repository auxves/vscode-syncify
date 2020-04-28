import { resolve } from "path";
import { Environment, FS, Profile, Settings } from "~/services";
import { getCleanupPath } from "~/tests/getCleanupPath";

jest.mock("~/services/localize.ts");

const cleanupPath = getCleanupPath("services/profile");

const pathToTest = resolve(cleanupPath, "test");

const paths = [pathToTest];

jest
	.spyOn(Environment, "settings", "get")
	.mockReturnValue(resolve(pathToTest, "settings.json"));

beforeEach(async () => Promise.all(paths.map(async p => FS.mkdir(p))));

afterEach(async () => FS.remove(cleanupPath));

test("switch", async () => {
	await Settings.set({
		repo: {
			profiles: [
				{
					name: "1",
					branch: "1"
				},
				{
					name: "2",
					branch: "2"
				}
			],
			currentProfile: "1"
		}
	});

	await Profile.switchProfile("2");

	const currentProfile = await Settings.get(s => s.repo.currentProfile);

	expect(currentProfile).toBe("2");
});
