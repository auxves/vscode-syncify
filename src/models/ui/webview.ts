import { WebviewPanel } from "vscode";
import { IReplaceable } from "~/models";

export interface IWebview {
  html: string;
  webview?: WebviewPanel;
  replaceables: IReplaceable[];
}
