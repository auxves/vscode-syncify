import { resolve } from "path";
import { ILanguagePack } from "~/models";
import { store } from "~/redux/store";
import { FS, Logger } from "~/services";

let pack: ILanguagePack = {};

export async function initLocalization(lang?: string) {
  pack = await (async () => {
    try {
      const extensionPath = store.getState().extensionPath;

      const language = (() => {
        if (lang) return lang;

        if (process.env.VSCODE_NLS_CONFIG) {
          return JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
        }
      })();

      const languagePackPath = resolve(
        extensionPath,
        `package.nls.${language}.json`
      );

      const languageExists = await FS.exists(languagePackPath);

      if (!languageExists || language === "en-us") {
        return JSON.parse(
          await FS.read(resolve(extensionPath, "package.nls.json"))
        );
      }

      return JSON.parse(await FS.read(languagePackPath));
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
