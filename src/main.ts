import * as vscode from "vscode";
import { InitService } from "./services/init.service";
import { state } from "./state";

export async function activate(context: vscode.ExtensionContext) {
  state.context = context;

  await InitService.init();
}
