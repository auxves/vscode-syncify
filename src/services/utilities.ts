import merge from "lodash/merge";

export class Utilities {
  public static sleep(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  public static merge<TObject, TSource>(
    object: TObject,
    source: TSource
  ): TObject & TSource {
    return merge<TObject, TSource>(JSON.parse(JSON.stringify(object)), source);
  }
}
