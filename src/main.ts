import { state } from "models/state.model";
import { InitService } from "services/utility/init.service";
import * as vscode from "vscode";

export async function activate(context: vscode.ExtensionContext) {
  state.context = context;

  await InitService.init();
}
