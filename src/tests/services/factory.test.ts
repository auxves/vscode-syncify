import { Factory } from "~/services";
import { FileSyncer, GitSyncer } from "~/syncers";

jest.mock("~/services/localize.ts");

test("git syncer", () => {
	expect(Factory.generate("git")).toBeInstanceOf(GitSyncer);
});

test("file syncer", () => {
	expect(Factory.generate("file")).toBeInstanceOf(FileSyncer);
});
