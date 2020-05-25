export function stringifyPretty(object: any): string {
	return JSON.stringify(object, undefined, "\t");
}
