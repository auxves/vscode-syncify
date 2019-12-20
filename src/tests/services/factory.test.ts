import { Syncer } from "~/models";
import { Factory } from "~/services";
import { FileSyncer, RepoSyncer } from "~/syncers";

jest.mock("~/services/localize.ts");

it("should create repo syncer", () => {
  expect(Factory.generate(Syncer.Repo)).toBeInstanceOf(RepoSyncer);
});

it("should create file syncer", () => {
  expect(Factory.generate(Syncer.File)).toBeInstanceOf(FileSyncer);
});
