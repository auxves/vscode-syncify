import { IWebviewSetting } from "./webview-setting.model";

export interface IWebviewSection {
  name: string;
  settings: IWebviewSetting[];
}