import { SelectOption, UISettingType } from "~/models";

interface Checkbox {
  name: string;
  type: UISettingType.Checkbox;
  correspondingSetting: string;
}

interface TextInput {
  name: string;
  type: UISettingType.TextInput;
  correspondingSetting: string;
  placeholder: string;
}

interface TextArea {
  name: string;
  type: UISettingType.TextArea;
  correspondingSetting: string;
  placeholder: string;
}

interface NumberInput {
  name: string;
  type: UISettingType.NumberInput;
  correspondingSetting: string;
  placeholder: string;
  min?: number;
  max?: number;
}

interface Select {
  name: string;
  type: UISettingType.Select;
  correspondingSetting: string;
  options: SelectOption[];
}

interface ObjectArray {
  name: string;
  type: UISettingType.ObjectArray;
  correspondingSetting: string;
  schema: WebviewSetting[];
  newTemplate: object;
}

export type WebviewSetting =
  | Checkbox
  | Select
  | TextArea
  | TextInput
  | NumberInput
  | ObjectArray;
