import { Syncer } from "~/models";
import { Factory } from "~/services";
import { FileSyncer, RepoSyncer } from "~/syncers";

jest.mock("~/services/localization.ts");

it("should create repo service", () => {
  expect(Factory.generate(Syncer.Repo)).toBeInstanceOf(RepoSyncer);
});

it("should create file service", () => {
  expect(Factory.generate(Syncer.File)).toBeInstanceOf(FileSyncer);
});
