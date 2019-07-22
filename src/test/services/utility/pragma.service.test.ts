import { OperatingSystem } from "../../../models/os.model";
import { state } from "../../../models/state.model";
import { PragmaService } from "../../../services/utility/pragma.service";

jest.mock("../../../services/utility/localization.service.ts");
jest.mock("../../../models/state.model.ts");

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

describe("host", () => {
  it("should work with 'host'", () => {
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
});

describe("os", () => {
  Object.keys(OperatingSystem).forEach(key => {
    it(`should work on 'OperatingSystem.${key}'`, () => {
      state.env.os = OperatingSystem[key];
      const initial = `{
        // @sync os=${key.toLowerCase()}
        "abc": "xyz"
      }`;

      const expected = `{
        // @sync os=${key.toLowerCase()}
        "abc": "xyz"
      }`;

      expect(PragmaService.processBeforeWrite("{}", initial, null)).toBe(
        expected
      );
    });
  });
});

describe("env", () => {
  it("should work with 'env'", () => {
    process.env.SYNCIFY = "true";
    const initial = `{
      // @sync env=SYNCIFY
      "abc": "xyz"
    }`;

    const expected = `{
      // @sync env=SYNCIFY
      "abc": "xyz"
    }`;

    expect(PragmaService.processBeforeWrite("{}", initial, null)).toBe(
      expected
    );

    const initial2 = `{
      // @sync env=SINCIFY
      "abc": "xyz"
    }`;

    const expected2 = `{
      // @sync env=SINCIFY
      // "abc": "xyz"
    }`;

    expect(PragmaService.processBeforeWrite("{}", initial2, null)).toBe(
      expected2
    );
  });
});
