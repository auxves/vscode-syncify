import { Localization } from "~/services";

const cache: { [key: string]: typeof Localization.prototype.localize } = {};

function locale(lang: string) {
  if (cache[lang]) return cache[lang];

  const localizer = new Localization(lang);
  cache[lang] = localizer.localize.bind(localizer);

  return cache[lang];
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
  expect(locale("en")("")).toBe("");

  const rand = Math.random().toString();
  expect(locale("en")(rand)).toBe(rand);
});
