import cloneDeep from "lodash/cloneDeep";
import merge from "lodash/merge";

export class Utilities {
  public static sleep(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  public static merge<TObj, TSrc>(object: TObj, source: TSrc): TObj & TSrc {
    return merge<TObj, TSrc>(cloneDeep(object), source);
  }
}
