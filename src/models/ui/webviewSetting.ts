import { ISelectOption, UISettingType } from "~/models";

interface ICheckbox {
  name: string;
  type: UISettingType.Checkbox;
  correspondingSetting: string;
}

interface ITextInput {
  name: string;
  type: UISettingType.TextInput;
  correspondingSetting: string;
  placeholder: string;
}

interface ITextArea {
  name: string;
  type: UISettingType.TextArea;
  correspondingSetting: string;
  placeholder: string;
}

interface INumberInput {
  name: string;
  type: UISettingType.NumberInput;
  correspondingSetting: string;
  placeholder: string;
  min?: number;
  max?: number;
}

interface ISelect {
  name: string;
  type: UISettingType.Select;
  correspondingSetting: string;
  options: ISelectOption[];
}

interface IObjectArray {
  name: string;
  type: UISettingType.ObjectArray;
  correspondingSetting: string;
  schema: IWebviewSetting[];
  newTemplate: object;
}

export type IWebviewSetting =
  | ICheckbox
  | ISelect
  | ITextArea
  | ITextInput
  | INumberInput
  | IObjectArray;
