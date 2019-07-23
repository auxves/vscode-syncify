import { state } from "models/state.model";
import { InitService } from "services/utility/init.service";
import { ExtensionContext } from "vscode";

export async function activate(context: ExtensionContext) {
  state.context = context;

  await InitService.init();
}
