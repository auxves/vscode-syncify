import cloneDeep from "lodash/cloneDeep";
import mergeWith from "lodash/mergeWith";

export function merge<T, J>(object: T, source: J): T & J {
	return mergeWith<T, J>(cloneDeep(object), source, (leftVal, rightVal) => {
		if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
			return rightVal;
		}
	});
}
