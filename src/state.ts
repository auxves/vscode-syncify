import { ExtensionContext } from "vscode";

const state: { context?: ExtensionContext; isDebugMode: boolean } = {
  isDebugMode: false
};

export default state;
