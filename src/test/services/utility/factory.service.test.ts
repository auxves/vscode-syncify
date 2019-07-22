import { SyncMethod } from "../../../models/sync-method.model";
import { FileService } from "../../../services/sync/file.service";
import { RepoService } from "../../../services/sync/repo.service";
import { FactoryService } from "../../../services/utility/factory.service";

jest.mock("../../../services/utility/localization.service.ts");

it("should create repo service", () => {
  expect(FactoryService.generate(SyncMethod.Repo)).toBeInstanceOf(RepoService);
});

it("should create file service", () => {
  expect(FactoryService.generate(SyncMethod.File)).toBeInstanceOf(FileService);
});
