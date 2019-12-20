import { initLocalization, localize } from "~/services";

it("should localize english", async () => {
  await initLocalization("en-us");

  const installed = {
    expected: "Syncify: Installed 5",
    result: localize("(info) download.installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Uninstalled 10",
    result: localize("(info) download.uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should localize another language", async () => {
  await initLocalization("it");

  const installed = {
    expected: "Syncify: Installato 5",
    result: localize("(info) download.installed", "5")
  };
  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Disinstallato 10",
    result: localize("(info) download.uninstalled", "10")
  };
  expect(uninstalled.result).toBe(uninstalled.expected);
});

it("should return key for invalid key", async () => {
  await initLocalization("en-us");

  expect(localize("")).toBe("");

  const rand = Math.random().toString();
  expect(localize(rand)).toBe(rand);
});
