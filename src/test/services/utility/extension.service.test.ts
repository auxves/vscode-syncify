import _isEqual from "lodash/isEqual";
import { extensions } from "vscode";
import { ExtensionService } from "~/services";

function isEqual(arr1: any[], arr2: any[]): boolean {
  return _isEqual([...arr1].sort(), [...arr2].sort());
}

function setExtensions(exts: string[]): void {
  extensions.all = exts.map(ext => ({
    id: ext,
    packageJSON: { isBuiltin: false },
    extensionPath: "",
    isActive: false,
    exports: null,
    activate: () => null
  }));
}

it("should properly get missing extensions", () => {
  setExtensions(["publisher1.extension1"]);

  const missing = ExtensionService.getMissingExtensions([
    "publisher1.extension1",
    "publisher2.extension2",
    "publisher3.extension3"
  ]);

  const expected = ["publisher2.extension2", "publisher3.extension3"];

  expect(isEqual(missing, expected)).toBeTruthy();
});

it("should properly get unneeded extensions", () => {
  setExtensions([
    "publisher1.extension1",
    "publisher2.extension2",
    "publisher3.extension3"
  ]);

  const unneeded = ExtensionService.getUnneededExtensions([
    "publisher1.extension1"
  ]);

  const expected = ["publisher2.extension2", "publisher3.extension3"];

  expect(isEqual(unneeded, expected)).toBeTruthy();
});
