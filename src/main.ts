import { ExtensionContext } from "vscode";
import { state } from "~/models";
import { InitService, WebviewService } from "~/services";

export async function activate(context: ExtensionContext) {
  state.context = context;

  WebviewService.fetchHTMLContent();

  await InitService.init();
}
