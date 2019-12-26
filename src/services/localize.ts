import { resolve } from "path";
import { ILanguagePack } from "~/models";
import { Environment, FS, Logger } from "~/services";

let pack: ILanguagePack = {};

export async function initLocalization(lang?: string) {
  pack = await (async () => {
    try {
      const language = (() => {
        if (lang) return lang;

        if (process.env.VSCODE_NLS_CONFIG) {
          return JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
        }
      })();

      const languagePackPath = resolve(
        Environment.extensionPath,
        `package.nls.${language}.json`
      );

      const languageExists = await FS.exists(languagePackPath);

      const defaultPack = JSON.parse(
        await FS.read(resolve(Environment.extensionPath, "package.nls.json"))
      );

      if (!languageExists || language === "en-us") {
        return defaultPack;
      }

      return { ...defaultPack, ...JSON.parse(await FS.read(languagePackPath)) };
    } catch (err) {
      Logger.error(err);
      return {};
    }
  })();
}

export function localize(key: string, ...args: string[]): string {
  return args.reduce(
    (acc, v, i) => acc.replace(new RegExp(`\\{${i}\\}`, "g"), v),
    pack[key] ?? key
  );
}
