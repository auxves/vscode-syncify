import { Localization } from "~/services";

function locale(lang: string): (key: string, ...args: string[]) => string {
  return (key: string, ...args: string[]) =>
    new Localization(lang).localize(key, ...args);
}

it("should localize english", () => {
  const installed = {
    expected: "Syncify: Installed 5",
    result: locale("en")("(info) download.installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Uninstalled 10",
    result: locale("en")("(info) download.uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should localize another language", () => {
  const installed = {
    expected: "Syncify: Installato 5",
    result: locale("it")("(info) download.installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Disinstallato 10",
    result: locale("it")("(info) download.uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should return key for invalid key", () => {
  expect(locale("en")(null)).toBe(null);

  const rand = Math.random().toString();
  expect(locale("en")(rand)).toBe(rand);
});
