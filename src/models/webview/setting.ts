import { SelectOption, UISettingType } from "~/models";

type Checkbox = {
	name: string;
	type: UISettingType.Checkbox;
	correspondingSetting: string;
};

type TextInput = {
	name: string;
	type: UISettingType.TextInput;
	correspondingSetting: string;
	placeholder: string;
};

type TextArea = {
	name: string;
	type: UISettingType.TextArea;
	correspondingSetting: string;
	placeholder: string;
};

type NumberInput = {
	name: string;
	type: UISettingType.NumberInput;
	correspondingSetting: string;
	placeholder: string;
	min?: number;
	max?: number;
};

type Select = {
	name: string;
	type: UISettingType.Select;
	correspondingSetting: string;
	options: SelectOption[];
};

type ObjectArray = {
	name: string;
	type: UISettingType.ObjectArray;
	correspondingSetting: string;
	schema: WebviewSetting[];
	newTemplate: object;
};

export type WebviewSetting =
	| Checkbox
	| Select
	| TextArea
	| TextInput
	| NumberInput
	| ObjectArray;
