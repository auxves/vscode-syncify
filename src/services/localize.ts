import { resolve } from "path";
import { LanguagePack } from "~/models";
import { Environment, FS, Logger } from "~/services";

let pack: LanguagePack = {};

export async function initLocalization(lang?: string) {
	pack = await (async () => {
		try {
			const language: string = (() => {
				if (lang) return lang;

				if (process.env.VSCODE_NLS_CONFIG) {
					return JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
				}

				return "en-us";
			})();

			const languagePackPath = resolve(
				Environment.extensionPath,
				`package.nls.${language}.json`,
			);

			const languageExists = await FS.exists(languagePackPath);

			const defaultPack = JSON.parse(
				await FS.read(resolve(Environment.extensionPath, "package.nls.json")),
			);

			if (!languageExists || language === "en-us") {
				return defaultPack;
			}

			return { ...defaultPack, ...JSON.parse(await FS.read(languagePackPath)) };
		} catch (error) {
			Logger.error(error);
			return {};
		}
	})();
}

const formatRegex = /{(\d+?)}/g;

export function localize(key: string, ...args: string[]): string {
	return pack[key]?.replace(formatRegex, (_, index) => args[index]) ?? key;
}
