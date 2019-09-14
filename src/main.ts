import { ExtensionContext } from "vscode";
import { state } from "~/models";
import { Initializer, Webview } from "~/services";

export async function activate(context: ExtensionContext) {
  state.context = context;

  Webview.fetchHTMLContent();

  await Initializer.init();
}
