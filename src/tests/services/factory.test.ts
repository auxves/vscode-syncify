import { Factory } from "~/services";
import { LocalSyncer, GitSyncer } from "~/syncers";

jest.mock("~/services/localize.ts");

test("git syncer", () => {
	expect(Factory.generate("git")).toBeInstanceOf(GitSyncer);
});

test("local syncer", () => {
	expect(Factory.generate("local")).toBeInstanceOf(LocalSyncer);
});
