import { window, workspace } from "vscode";
import { localize } from "~/services";
import fetch from "node-fetch";

export namespace Logger {
	const output = window.createOutputChannel("Syncify");

	const fetchDescription = async (message: string) => {
		const body = await fetch("https://pastebin.com/raw/cu5vtiAL")
			.then((res) => res.text())
			.then((res) => res.replace(/\r/g, ""));

		const matchers = body.split(/\n+---\n+/).map((str) => {
			const description = str.slice(str.indexOf("\n\n") + 2);
			const matcher = str.split("\n\n")[0].match(/^Matcher: \/(.*)\/$/)![1];

			return {
				description,
				regex: new RegExp(matcher, "gi"),
			};
		});

		return matchers.find(({ regex }) => regex.test(message))?.description;
	};

	export const error = async ({ message }: Error): Promise<void> => {
		output.appendLine(`[error] ${message.trim()}`);

		const result = await window.showErrorMessage(
			localize("(info) Logger.error -> show details"),
			localize("(label) Logger.error -> show details"),
		);

		if (result) {
			output.show();

			const content = await fetchDescription(message);

			if (content) {
				await window.showTextDocument(
					await workspace.openTextDocument({ content, language: "markdown" }),
				);
			}
		}
	};

	const stringify = (value: any) => {
		return Array.isArray(value) ? JSON.stringify(value, undefined, 2) : value;
	};

	export const info = (...args: any[]): void => {
		output.appendLine(`[info] ${args.map(stringify).join(" ").trim()}`);
	};
}
