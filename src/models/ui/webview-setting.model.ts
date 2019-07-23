import { UISettingType } from "models/ui/setting-type.model";

export interface IWebviewSetting {
  name: string;
  placeholder: string;
  type: UISettingType;
  correspondingSetting: string;
  [key: string]: any;
}
