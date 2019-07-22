import { PragmaService } from "../../../services/utility/pragma.service";

jest.mock("../../../services/utility/localization.service.ts");

it("should properly process before uploading", async () => {
  const initial = `{
    // @sync host=jest
    // "abc": "xyz"
  }`;
  const expected = `{
    // @sync host=jest
    "abc": "xyz"
  }`;
  expect(await PragmaService.processBeforeUpload(initial)).toBe(expected);
});

it("should properly process before writing", () => {
  const initial = `{
    // @sync host=jest
    "abc": "xyz"
  }`;
  const expected = `{
    // @sync host=jest
    // "abc": "xyz"
  }`;
  expect(PragmaService.processBeforeWrite("{}", initial, "test")).toBe(
    expected
  );

  const expected2 = `{
    // @sync host=jest
    "abc": "xyz"
  }`;
  expect(PragmaService.processBeforeWrite("{}", initial, "jest")).toBe(
    expected2
  );
});
