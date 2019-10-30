export function isJSON(json: string): boolean {
  try {
    const uncommented = json
      .replace(/\s*(\/\/.+)|(\/\*.+\*\/)/g, "")
      .replace(/,\s*\}/g, " }");

    JSON.parse(uncommented);
    return true;
  } catch {
    return false;
  }
}
