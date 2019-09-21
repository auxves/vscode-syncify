import { IReplaceable } from "~/models";

export interface IGenerationOptions {
  items: IReplaceable[];
  content: string;
  [key: string]: any;
}
