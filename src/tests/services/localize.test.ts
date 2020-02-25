import { initLocalization, localize } from "~/services";

test("basic functionality", async () => {
  await initLocalization("en-us");

  const installed = {
    expected: "Syncify: Installed 5",
    result: localize("(info) extensions -> installed", "5")
  };

  expect(installed.result).toBe(installed.expected);

  const uninstalled = {
    expected: "Syncify: Uninstalled 10",
    result: localize("(info) extensions -> uninstalled", "10")
  };

  expect(uninstalled.result).toBe(uninstalled.expected);
});

test("invalid key", async () => {
  await initLocalization("en-us");

  expect(localize("")).toBe("");

  const rand = Math.random().toString();

  expect(localize(rand)).toBe(rand);
});
