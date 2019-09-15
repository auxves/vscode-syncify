import { WebviewPanel } from "vscode";

export interface IWebview {
  name: string;
  html: string;
  webview?: WebviewPanel;
  replaceables: object[];
}
