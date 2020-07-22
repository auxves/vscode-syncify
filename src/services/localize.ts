import { Environment, FS, Logger } from "~/services";
import { resolve } from "path";

type LanguagePack = { [key: string]: string | undefined };

let pack: LanguagePack = {};

export const initLocalization = async (lang?: string) => {
	try {
		const extensionPath = Environment.extensionPath();

		const nlsConfig = process.env.VSCODE_NLS_CONFIG;

		const language: string =
			lang ?? (nlsConfig && JSON.parse(nlsConfig).locale) ?? "en";

		const languagePackPath = resolve(
			extensionPath,
			`package.nls.${language}.json`,
		);

		const languageExists = await FS.exists(languagePackPath);

		const defaultPath = resolve(extensionPath, "package.nls.json");

		const defaultPack = JSON.parse(await FS.read(defaultPath));

		pack =
			languageExists && language !== "en"
				? { ...defaultPack, ...JSON.parse(await FS.read(languagePackPath)) }
				: defaultPack;
	} catch (error) {
		void Logger.error(error);
	}
};

const formatRegex = /{(\d+?)}/g;

export const localize = (key: string, ...args: string[]) => {
	return pack[key]?.replace(formatRegex, (_, index) => args[index]) ?? key;
};
