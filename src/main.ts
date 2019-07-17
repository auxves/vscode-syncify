import * as vscode from "vscode";
import { state } from "./models/state.model";
import { InitService } from "./services/init.service";

export async function activate(context: vscode.ExtensionContext) {
  state.context = context;

  await InitService.init();
}
