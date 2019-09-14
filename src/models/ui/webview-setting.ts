import { UISettingType } from "~/models";

export interface IWebviewSetting {
  name: string;
  placeholder: string;
  type: UISettingType;
  correspondingSetting: string;
  [key: string]: any;
}
