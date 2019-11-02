import cloneDeep from "lodash/cloneDeep";
import origMerge from "lodash/merge";

export function merge<T, J>(object: T, source: J): T & J {
  return origMerge<T, J>(cloneDeep(object), source);
}
