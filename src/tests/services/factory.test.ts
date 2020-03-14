import { Syncers } from "~/models";
import { Factory } from "~/services";
import { FileSyncer, RepoSyncer } from "~/syncers";

jest.mock("~/services/localize.ts");

test("repo syncer", () => {
	expect(Factory.generate(Syncers.Repo)).toBeInstanceOf(RepoSyncer);
});

test("file syncer", () => {
	expect(Factory.generate(Syncers.File)).toBeInstanceOf(FileSyncer);
});
