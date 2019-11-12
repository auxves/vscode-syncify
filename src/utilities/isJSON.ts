import { parse } from "jsonc-parser";

export function isJSON(json: string): boolean {
  return !!parse(json);
}
