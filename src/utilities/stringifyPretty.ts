export function stringifyPretty(object: any) {
	return JSON.stringify(object, null, "\t");
}
