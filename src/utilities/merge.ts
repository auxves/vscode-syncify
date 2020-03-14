import cloneDeep from "lodash/cloneDeep";
import mergeWith from "lodash/mergeWith";

export function merge<T, J>(object: T, source: J): T & J {
	return mergeWith<T, J>(cloneDeep(object), source, (leftValue, rightValue) => {
		if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
			return rightValue;
		}
	});
}
