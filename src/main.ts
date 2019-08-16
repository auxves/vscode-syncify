import { state } from "@/models";
import { InitService } from "@/services";
import { ExtensionContext } from "vscode";

export async function activate(context: ExtensionContext) {
  state.context = context;

  await InitService.init();
}
