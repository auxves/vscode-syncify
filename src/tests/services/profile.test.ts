import { ensureDir, remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";
import { Environment, Initializer, Profile, Settings } from "~/services";

jest.mock("~/services/localization.ts");

const cleanupPath = resolve(tmpdir(), "syncify-jest/services/prpfile");
const testFolder = `${cleanupPath}/test`;

jest
  .spyOn(Environment, "settings", "get")
  .mockReturnValue(resolve(testFolder, "settings.json"));

Initializer.init = jest.fn();

beforeEach(() => Promise.all([ensureDir(testFolder)]));

afterEach(() => remove(cleanupPath));

it("should switch profile", async () => {
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

  await Profile.switch("2");

  const settings = await Settings.get();

  expect(settings.repo.currentProfile).toBe("2");
});
