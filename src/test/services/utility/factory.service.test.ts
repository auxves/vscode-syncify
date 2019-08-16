import { SyncMethod } from "@/models";
import { FactoryService, FileService, RepoService } from "@/services";

jest.mock("@/services/utility/localization.service.ts");

it("should create repo service", () => {
  expect(FactoryService.generate(SyncMethod.Repo)).toBeInstanceOf(RepoService);
});

it("should create file service", () => {
  expect(FactoryService.generate(SyncMethod.File)).toBeInstanceOf(FileService);
});
