/* Originally from shanalikhan/code-settings-sync */

import { OperatingSystem } from "~/models";
import { Environment, Logger } from "~/services";
import { isJSON } from "~/utilities";

export namespace Pragma {
	export function processIncoming(
		hostname: string,
		newContent: string,
		localContent = "{}"
	): string {
		if (!isJSON(newContent) || !isJSON(localContent)) {
			return newContent;
		}

		const parsedLines: string[] = [];
		const lines = newContent.split("\n");

		for (let index = 0; index < lines.length; index++) {
			let shouldComment = false;

			if (pragmaRegex.test(lines[index])) {
				try {
					const osMatch = /os=(\w+)/.exec(lines[index]);
					if (osMatch) {
						const osFromPragma = osMatch[1].toLowerCase();

						if (!supportedOS.includes(osFromPragma)) continue;

						if (osFromString(osFromPragma) !== Environment.os) {
							shouldComment = true;
						}
					}

					const hostMatch = /host=(\S+)/.exec(lines[index]);
					if (
						hostMatch &&
						(!hostname || hostMatch[1].toLowerCase() !== hostname.toLowerCase())
					) {
						shouldComment = true;
					}

					const envMatch = /env=(\S+)/.exec(lines[index]);
					if (envMatch && !process.env[envMatch[1].toUpperCase()]) {
						shouldComment = true;
					}

					parsedLines.push(lines[index]);

					index = checkNextLines(
						lines,
						parsedLines,
						index,
						false,
						shouldComment
					);
				} catch (error) {
					Logger.error(error);
					continue;
				}
			} else if (ignoreRegex.test(lines[index])) {
				index = checkNextLines(lines, parsedLines, index, true, false);
			} else {
				parsedLines.push(lines[index]);
			}
		}

		let result = parsedLines.join("\n");

		const ignoredBlocks = getIgnoredBlocks(localContent);

		if (ignoredBlocks) {
			result = result.replace(
				/(\s*)\}(?![\s\S]*\s*\})/,
				`\n\n\n${ignoredBlocks}$1}`
			);
		}

		return result;
	}

	export function processOutgoing(fileContent: string): string {
		if (!isJSON(fileContent)) return fileContent;

		const lines = fileContent.split("\n");
		const parsedLines: string[] = [];

		for (let index = 0; index < lines.length; index++) {
			if (ignoreRegex.test(lines[index])) {
				index = checkNextLines(lines, parsedLines, index, true);
			} else if (pragmaRegex.test(lines[index])) {
				const osMatch = osRegex.exec(lines[index]);
				if (osMatch) {
					const osFromPragma = osMatch[1] ?? osMatch[2] ?? osMatch[3];

					if (osFromPragma && /\s/.test(osFromPragma)) {
						lines[index] = lines[index].replace(
							osFromPragma,
							osFromPragma.trimStart()
						);
					}
				}

				const hostMatch = hostRegex.exec(lines[index]);
				if (hostMatch) {
					const hostFromPragma = hostMatch[1] ?? hostMatch[2] ?? hostMatch[3];
					if (hostFromPragma && /\s/.test(hostFromPragma)) {
						lines[index] = lines[index].replace(
							hostFromPragma,
							hostFromPragma.trimStart()
						);
					}
				}

				const envMatch = envRegex.exec(lines[index]);
				if (envMatch) {
					const envFromPragma = envMatch[1] ?? envMatch[2] ?? envMatch[3];
					if (envFromPragma && /\s/.test(envFromPragma)) {
						lines[index] = lines[index].replace(
							envFromPragma,
							envFromPragma.trimStart()
						);
					}
				}

				parsedLines.push(lines[index]);
				index = checkNextLines(lines, parsedLines, index, false, false);
			} else {
				parsedLines.push(lines[index]);
			}
		}

		return parsedLines
			.join("\n")
			.replace(/(\s*){(\n|\s)+\n(\s*)/, "$1{\n$3")
			.replace(/(\n|\s)+\n(\s*)}(?![\s\S]*\s*})/, "\n$2}");
	}

	const pragmaRegex = /\/{2}[\s\t]*@sync[\s\t]+(?:os=.+[\s\t]*)?(?:host=.+[\s\t]*)?(?:env=.+[\s\t]*)?/;
	const ignoreRegex = /\/{2}[\s\t]*@sync-ignore/;
	const hostRegex = /(?:host=(.+)os=)|(?:host=(.+)env=)|host=(.+)\n?/;
	const osRegex = /(?:os=(.+)host=)|(?:os=(.+)env=)|os=(.+)\n?/;
	const envRegex = /(?:env=(.+)host=)|(?:env=(.+)os=)|env=(.+)\n?/;

	const supportedOS = Object.keys(OperatingSystem)
		.filter(k => !/\d/.test(k))
		.map(k => k.toLowerCase());

	function getIgnoredBlocks(content: string): string {
		const ignoredLines: string[] = [];
		const lines = content.replace(/@sync ignore/g, "@sync-ignore").split("\n");
		let currentLine = "";
		for (let index = 0; index < lines.length; index++) {
			currentLine = lines[index];
			if (ignoreRegex.test(currentLine)) {
				ignoredLines.push(currentLine);
				index = checkNextLines(lines, ignoredLines, index, false, false, true);
			}
		}

		return ignoredLines.join("\n");
	}

	function toggleComments(line: string, shouldComment: boolean) {
		const isCommented = line.trim().startsWith("//");
		return shouldComment
			? isCommented
				? line
				: line.replace(/^(\s*)/, "$1// ")
			: isCommented
			? line.replace(/\/\/\s/, "")
			: line;
	}

	function checkNextLines(
		lines: string[],
		parsedLines: string[],
		currentIndex: number,
		shouldIgnore: boolean,
		shouldComment = false,
		checkTrailingComma = false
	): number {
		let index = currentIndex;
		let currentLine = lines[++index];

		const opensCurlyBraces = currentLine.includes("{");
		const opensBrackets = /".+"\s*:\s*\[/.test(currentLine);

		const closesCurlyBraces = currentLine.includes("}");
		const closesBrackets = currentLine.includes("]");

		let openedBlock =
			(opensCurlyBraces || opensBrackets) &&
			!(closesCurlyBraces || closesBrackets);

		if (
			!openedBlock &&
			checkTrailingComma &&
			!currentLine.trim().endsWith(",")
		) {
			currentLine = `${currentLine.trimEnd()},`;
		}

		if (!shouldIgnore) {
			parsedLines.push(toggleComments(currentLine, shouldComment));
		}

		if (openedBlock) {
			while (openedBlock) {
				currentLine = lines[++index];
				if (
					(opensCurlyBraces && currentLine.includes("}")) ||
					(opensBrackets && currentLine.includes("]"))
				) {
					if (checkTrailingComma && !currentLine.trim().endsWith(",")) {
						currentLine = `${currentLine.trimEnd()},`;
					}

					openedBlock = false;
				}

				if (!shouldIgnore) {
					parsedLines.push(toggleComments(currentLine, shouldComment));
				}
			}
		}

		return index;
	}

	function osFromString(osName: string): OperatingSystem {
		switch (osName) {
			case "mac":
				return OperatingSystem.Mac;
			case "linux":
				return OperatingSystem.Linux;
			case "windows":
			default:
				return OperatingSystem.Windows;
		}
	}
}
