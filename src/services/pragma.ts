/* Originally from shanalikhan/code-settings-sync */

import { OperatingSystem } from "~/models";
import { Environment, Logger } from "~/services";
import { isJSON } from "~/utilities";

export class Pragma {
  public static processIncoming(
    hostname: string,
    newContent: string,
    localContent: string = "{}"
  ): string {
    if (!isJSON(newContent) || !isJSON(localContent)) {
      return newContent;
    }

    const parsedLines: string[] = [];
    const lines = newContent.split("\n");

    for (let index = 0; index < lines.length; index++) {
      let shouldComment = false;

      if (Pragma.pragmaRegex.test(lines[index])) {
        try {
          const osMatch = lines[index].match(/os=(\w+)/);
          if (osMatch) {
            const osFromPragma = osMatch[1].toLowerCase();

            if (!Pragma.supportedOS.includes(osFromPragma)) {
              continue;
            }

            if (Pragma.osFromString(osFromPragma) !== Environment.os) {
              shouldComment = true;
            }
          }

          const hostMatch = lines[index].match(/host=(\S+)/);
          if (hostMatch) {
            const hostFromPragma = hostMatch[1];
            if (
              !hostname ||
              hostFromPragma.toLowerCase() !== hostname.toLowerCase()
            ) {
              shouldComment = true;
            }
          }

          const envMatch = lines[index].match(/env=(\S+)/);
          if (envMatch) {
            const envFromPragma = envMatch[1];
            if (!process.env[envFromPragma.toUpperCase()]) {
              shouldComment = true;
            }
          }

          parsedLines.push(lines[index]);

          index = Pragma.checkNextLines(
            lines,
            parsedLines,
            index,
            false,
            shouldComment
          );
        } catch (err) {
          Logger.error(err);
          continue;
        }
      } else if (Pragma.ignoreRegex.test(lines[index])) {
        index = Pragma.checkNextLines(lines, parsedLines, index, true, false);
      } else {
        parsedLines.push(lines[index]);
      }
    }

    let result = parsedLines.join("\n");

    const ignoredBlocks = Pragma.getIgnoredBlocks(localContent);

    if (ignoredBlocks) {
      result = result.replace(/{\s*\n/, `{\n${ignoredBlocks}\n\n\n`);
    }

    return result;
  }

  public static processOutgoing(fileContent: string): string {
    if (!isJSON(fileContent)) return fileContent;

    const lines = fileContent.split("\n");
    const parsedLines: string[] = [];

    for (let index = 0; index < lines.length; index++) {
      if (Pragma.ignoreRegex.test(lines[index])) {
        index = Pragma.checkNextLines(lines, parsedLines, index, true);
      } else if (Pragma.pragmaRegex.test(lines[index])) {
        const osMatch = lines[index].match(Pragma.osRegex);
        if (osMatch) {
          const osFromPragma = osMatch[1] ?? osMatch[2] ?? osMatch[3];

          if (osFromPragma && /\s/.test(osFromPragma)) {
            lines[index] = lines[index].replace(
              osFromPragma,
              osFromPragma.trimLeft()
            );
          }
        }

        const hostMatch = lines[index].match(Pragma.hostRegex);
        if (hostMatch) {
          const hostFromPragma = hostMatch[1] ?? hostMatch[2] ?? hostMatch[3];
          if (hostFromPragma && /\s/.test(hostFromPragma)) {
            lines[index] = lines[index].replace(
              hostFromPragma,
              hostFromPragma.trimLeft()
            );
          }
        }

        const envMatch = lines[index].match(Pragma.envRegex);
        if (envMatch) {
          const envFromPragma = envMatch[1] ?? envMatch[2] ?? envMatch[3];
          if (envFromPragma && /\s/.test(envFromPragma)) {
            lines[index] = lines[index].replace(
              envFromPragma,
              envFromPragma.trimLeft()
            );
          }
        }

        parsedLines.push(lines[index]);
        index = Pragma.checkNextLines(lines, parsedLines, index, false, false);
      } else {
        parsedLines.push(lines[index]);
      }
    }
    return parsedLines.join("\n");
  }

  private static pragmaRegex: RegExp = /\/{2}[\s\t]*\@sync[\s\t]+(?:os=.+[\s\t]*)?(?:host=.+[\s\t]*)?(?:env=.+[\s\t]*)?/;
  private static ignoreRegex: RegExp = /\/{2}[\s\t]*\@sync-ignore/;
  private static hostRegex = /(?:host=(.+)os=)|(?:host=(.+)env=)|host=(.+)\n?/;
  private static osRegex = /(?:os=(.+)host=)|(?:os=(.+)env=)|os=(.+)\n?/;
  private static envRegex = /(?:env=(.+)host=)|(?:env=(.+)os=)|env=(.+)\n?/;

  private static supportedOS = Object.keys(OperatingSystem)
    .filter(k => !/\d/.test(k))
    .map(k => k.toLowerCase());

  private static getIgnoredBlocks(content: string): string {
    const ignoredLines: string[] = [];
    const lines = content.replace(/\@sync ignore/g, "@sync-ignore").split("\n");
    let currentLine = "";
    for (let index = 0; index < lines.length; index++) {
      currentLine = lines[index];
      if (Pragma.ignoreRegex.test(currentLine)) {
        ignoredLines.push(currentLine);
        index = Pragma.checkNextLines(
          lines,
          ignoredLines,
          index,
          false,
          false,
          true
        );
      }
    }
    return ignoredLines.join("\n");
  }

  private static toggleComments(line: string, shouldComment: boolean) {
    const isCommented = line.trim().startsWith("//");
    return shouldComment
      ? !isCommented
        ? line.replace(/^(\s*)/, "$1// ")
        : line
      : isCommented
      ? line.replace(/\/\/\s*/, "")
      : line;
  }

  private static checkNextLines(
    lines: string[],
    parsedLines: string[],
    currentIndex: number,
    shouldIgnore: boolean,
    shouldComment: boolean = false,
    checkTrailingComma: boolean = false
  ): number {
    let index = currentIndex;
    let currentLine = lines[++index];

    const opensCurlyBraces = /{/.test(currentLine);
    const opensBrackets = /".+"\s*:\s*\[/.test(currentLine);

    let openedBlock = opensCurlyBraces || opensBrackets;

    if (!openedBlock && checkTrailingComma && !currentLine.trim().endsWith(",")) {
      currentLine = `${currentLine.trimRight()},`;
    }

    if (!shouldIgnore) {
      parsedLines.push(Pragma.toggleComments(currentLine, shouldComment));
    }

    if (openedBlock) {
      while (openedBlock) {
        currentLine = lines[++index];
        if (
          (opensCurlyBraces && currentLine.includes("}")) ||
          (opensBrackets && currentLine.includes("]"))
        ) {
          if (checkTrailingComma && !currentLine.trim().endsWith(",")) {
            currentLine = `${currentLine.trimRight()},`;
          }
          openedBlock = false;
        }
        if (!shouldIgnore) {
          parsedLines.push(Pragma.toggleComments(currentLine, shouldComment));
        }
      }
    }

    return index;
  }

  private static osFromString(osName: string): OperatingSystem {
    switch (osName) {
      case "windows":
        return OperatingSystem.Windows;
      case "mac":
        return OperatingSystem.Mac;
      case "linux":
        return OperatingSystem.Linux;
      default:
        return OperatingSystem.Windows;
    }
  }
}
