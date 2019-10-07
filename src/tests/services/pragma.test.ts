import { OperatingSystem } from "~/models";
import { Environment, Pragma } from "~/services";

jest.mock("~/services/localization.ts");

it("should properly process before uploading", () => {
  const initial = `{
    // @sync host=jest
    // "abc": "xyz"
  }`;

  const expected = `{
    // @sync host=jest
    "abc": "xyz"
  }`;

  expect(Pragma.processOutgoing(initial)).toBe(expected);
});

it("should properly ignore", () => {
  const initial = `{
    // @sync-ignore
    "abc": "xyz",
    // @sync-ignore
    "abc2": "xyz2",
    "xyz": "abc"
  }`;

  const expected = `{
    "xyz": "abc"
  }`;

  expect(Pragma.processOutgoing(initial)).toBe(expected);

  const initial2 = `{
    "xyz": "def"
  }`;

  const expected2 = `{
    // @sync-ignore
    "abc": "xyz",
    // @sync-ignore
    "abc2": "xyz2",


    "xyz": "def"
  }`;

  expect(Pragma.processIncoming("", initial2, initial)).toBe(expected2);
});

it("should properly handle brackets", () => {
  const initial = `{
    // @sync host=jest
    // "abc": "{xyz}"
  }`;

  const expected = `{
    // @sync host=jest
    "abc": "{xyz}"
  }`;

  expect(Pragma.processOutgoing(initial)).toBe(expected);

  const initial2 = `{
    // @sync host=jest
    "abc": "[xyz]"
  }`;

  const expected2 = `{
    // @sync host=jest
    // "abc": "[xyz]"
  }`;

  expect(Pragma.processIncoming("test", initial2, initial2)).toBe(expected2);
});

describe("host", () => {
  it("should work with 'host'", () => {
    const valid = {
      initial: `{
        // @sync host=jest
        "abc": "xyz"
      }`,
      expected: `{
        // @sync host=jest
        // "abc": "xyz"
      }`
    };

    expect(Pragma.processIncoming("test", valid.initial)).toBe(valid.expected);

    const invalid = {
      initial: valid.initial,
      expected: `{
        // @sync host=jest
        "abc": "xyz"
      }`
    };

    expect(Pragma.processIncoming("jest", invalid.initial)).toBe(
      invalid.expected
    );
  });
});

describe("os", () => {
  Object.keys(OperatingSystem).forEach(key => {
    it(`should work on 'OperatingSystem.${key}'`, () => {
      Environment.os = OperatingSystem[key as keyof typeof OperatingSystem];

      const initial = `{
        // @sync os=${key.toLowerCase()}
        "abc": "xyz"
      }`;

      const expected = `{
        // @sync os=${key.toLowerCase()}
        "abc": "xyz"
      }`;

      expect(Pragma.processIncoming("", initial)).toBe(expected);
    });
  });
});

describe("env", () => {
  it("should work with 'env'", () => {
    process.env.SYNCIFY = "true";

    const valid = {
      initial: `{
        // @sync env=SYNCIFY
        "abc": "xyz"
      }`,
      expected: `{
        // @sync env=SYNCIFY
        "abc": "xyz"
      }`
    };

    expect(Pragma.processIncoming("", valid.initial)).toBe(valid.expected);

    const invalid = {
      initial: `{
        // @sync env=SINCIFY
        "abc": "xyz"
      }`,
      expected: `{
        // @sync env=SINCIFY
        // "abc": "xyz"
      }`
    };

    expect(Pragma.processIncoming("", invalid.initial)).toBe(invalid.expected);
  });
});
