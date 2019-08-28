import { state } from "@/models";
import { InitService, WebviewService } from "@/services";
import { ExtensionContext } from "vscode";

export async function activate(context: ExtensionContext) {
  state.context = context;

  WebviewService.fetchHTMLContent();

  await InitService.init();
}
