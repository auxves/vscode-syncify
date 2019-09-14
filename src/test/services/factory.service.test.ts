import { FileMethod, RepoMethod } from "~/methods";
import { SyncMethod } from "~/models";
import { Factory } from "~/services";

jest.mock("~/services/localization.service.ts");

it("should create repo service", () => {
  expect(Factory.generate(SyncMethod.Repo)).toBeInstanceOf(RepoMethod);
});

it("should create file service", () => {
  expect(Factory.generate(SyncMethod.File)).toBeInstanceOf(FileMethod);
});
