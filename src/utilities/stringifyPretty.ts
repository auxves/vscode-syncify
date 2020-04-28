export function stringifyPretty(object: any) {
	return JSON.stringify(object, undefined, "\t");
}
