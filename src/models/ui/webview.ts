import { WebviewPanel } from "vscode";

export interface IWebview {
  html: string;
  webview?: WebviewPanel;
  replaceables: object[];
}
