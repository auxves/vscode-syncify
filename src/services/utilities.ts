import cloneDeep from "lodash/cloneDeep";
import merge from "lodash/merge";
import { window } from "vscode";
import { localize } from "~/services/localization";

export class Utilities {
  public static sleep(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  public static merge<TObj, TSrc>(object: TObj, source: TSrc): TObj & TSrc {
    return merge<TObj, TSrc>(cloneDeep(object), source);
  }

  public static async confirm(id: string): Promise<boolean> {
    const response = await window.showWarningMessage(
      localize(`(confirm) ${id}`),
      localize("(btn) yes"),
      localize("(btn) no")
    );

    return response === localize("(btn) yes");
  }
}
