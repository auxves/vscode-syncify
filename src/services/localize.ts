import { Environment, FS, Logger } from "~/services";
import { resolve } from "path";

type LanguagePack = { [key: string]: string | undefined };

let pack: LanguagePack = {};

export async function initLocalization(lang?: string): Promise<void> {
	try {
		const language = ((): string => {
			if (lang) return lang;

			if (process.env.VSCODE_NLS_CONFIG) {
				return JSON.parse(process.env.VSCODE_NLS_CONFIG).locale;
			}

			return "en";
		})();

		const languagePackPath = resolve(
			Environment.extensionPath,
			`package.nls.${language}.json`,
		);

		const languageExists = await FS.exists(languagePackPath);

		const defaultPath = resolve(Environment.extensionPath, "package.nls.json");
		const defaultPack = JSON.parse(await FS.read(defaultPath));

		pack =
			languageExists && language !== "en"
				? { ...defaultPack, ...JSON.parse(await FS.read(languagePackPath)) }
				: defaultPack;
	} catch (error) {
		void Logger.error(error);
	}
}

const formatRegex = /{(\d+?)}/g;

export function localize(key: string, ...args: string[]) {
	return pack[key]?.replace(formatRegex, (_, index) => args[index]) ?? key;
}
