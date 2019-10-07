import { extensions } from "vscode";
import { Extensions } from "~/services";

function setExtensions(exts: string[]): void {
  extensions.all = exts.map(ext => ({
    id: ext,
    packageJSON: { isBuiltin: false },
    extensionPath: "",
    isActive: false,
    exports: null,
    activate: () => Promise.resolve()
  }));
}

it("should properly get missing extensions", () => {
  setExtensions(["publisher1.extension1"]);

  const missing = Extensions.getMissing([
    "publisher1.extension1",
    "publisher2.extension2",
    "publisher3.extension3"
  ]);

  const expected = ["publisher2.extension2", "publisher3.extension3"];

  expect(missing).toStrictEqual(expected);
});

it("should properly get unneeded extensions", () => {
  setExtensions([
    "publisher1.extension1",
    "publisher2.extension2",
    "publisher3.extension3"
  ]);

  const unneeded = Extensions.getUnneeded(["publisher1.extension1"]);

  const expected = ["publisher2.extension2", "publisher3.extension3"];

  expect(unneeded).toStrictEqual(expected);
});
