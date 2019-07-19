import { OperatingSystem } from "../../models/os.model";
import { state } from "../../models/state.model";

export class PragmaService {
  public static processBeforeWrite(
    localContent: string,
    newContent: string,
    hostName: string
  ): string {
    const parsedLines: string[] = [];
    const lines = newContent.split("\n");
    let osMatch: RegExpMatchArray;
    let osFromPragma: string;

    let hostMatch: RegExpMatchArray;
    let hostFromPragma: string;

    let envMatch: RegExpMatchArray;
    let envFromPragma: string;
    let currentLine: string = "";

    for (let index = 0; index < lines.length; index++) {
      let shouldComment = false;
      currentLine = lines[index];
      if (this.pragmaRegex.test(currentLine)) {
        try {
          osMatch = currentLine.match(/os=(\w+)/);
          if (osMatch !== null) {
            osFromPragma = osMatch[1].toLowerCase();

            if (!this.supportedOS.includes(osFromPragma)) {
              continue;
            }
            if (this.osTypeFromString(osFromPragma) !== state.env.os) {
              shouldComment = true;
            }
          }

          hostMatch = currentLine.match(/host=(\S+)/);
          if (hostMatch !== null) {
            hostFromPragma = hostMatch[1];
            if (
              hostName === null ||
              hostName === "" ||
              hostFromPragma.toLowerCase() !== hostName.toLowerCase()
            ) {
              shouldComment = true;
            }
          }

          envMatch = currentLine.match(/env=(\S+)/);
          if (envMatch !== null) {
            envFromPragma = envMatch[1];
            if (process.env[envFromPragma.toUpperCase()] === undefined) {
              shouldComment = true;
            }
          }
          parsedLines.push(currentLine);
          index = this.checkNextLines(
            lines,
            parsedLines,
            index,
            false,
            shouldComment
          );
        } catch (e) {
          console.error("Syncing: Error processing pragmas ", e.message);
          continue;
        }
      } else if (this.ignoreRegex.test(currentLine)) {
        index = this.checkNextLines(lines, parsedLines, index, true, false);
      } else {
        parsedLines.push(currentLine);
      }
    }

    let result = parsedLines.join("\n");
    const ignoredBlocks = this.getIgnoredBlocks(localContent);
    if (ignoredBlocks) {
      result = result.replace(/{\s*\n/, `{\n${ignoredBlocks}\n\n\n`);
    }

    try {
      const uncommented = this.removeAllComments(result).replace(
        /,\s*\}/g,
        " }"
      );
      JSON.parse(uncommented);
    } catch (e) {
      console.error("Syncing: Result content is not a valid JSON.", e.message);
    }

    return result;
  }

  public static async processBeforeUpload(
    fileContent: string
  ): Promise<string> {
    const lines = fileContent.split("\n");
    let osMatch: RegExpMatchArray;
    let osFromPragma: string;

    let hostMatch: RegExpMatchArray;
    let hostFromPragma: string;

    let envMatch: RegExpMatchArray;
    let envFromPragma: string;

    const parsedLines: string[] = [];
    let currentLine = "";

    for (let index = 0; index < lines.length; index++) {
      currentLine = lines[index];

      if (this.ignoreRegex.test(currentLine)) {
        index = this.checkNextLines(lines, parsedLines, index, true);
      } else if (this.pragmaRegex.test(currentLine)) {
        osMatch = currentLine.match(this.osRegex);
        if (osMatch !== null) {
          osFromPragma = osMatch[1] || osMatch[2] || osMatch[3];

          if (osFromPragma !== "" && /\s/.test(osFromPragma)) {
            currentLine = currentLine.replace(
              osFromPragma,
              osFromPragma.trimLeft()
            );
          }
        }

        hostMatch = currentLine.match(this.hostRegex);
        if (hostMatch !== null) {
          hostFromPragma = hostMatch[1] || hostMatch[2] || hostMatch[3];
          if (hostFromPragma !== "" && /\s/.test(hostFromPragma)) {
            currentLine = currentLine.replace(
              hostFromPragma,
              hostFromPragma.trimLeft()
            );
          }
        }

        envMatch = currentLine.match(this.envRegex);
        if (envMatch !== null) {
          envFromPragma = envMatch[1] || envMatch[2] || envMatch[3];
          if (envFromPragma !== "" && /\s/.test(envFromPragma)) {
            currentLine = currentLine.replace(
              envFromPragma,
              envFromPragma.trimLeft()
            );
          }
        }

        parsedLines.push(currentLine);
        index = this.checkNextLines(lines, parsedLines, index, false, false);
      } else {
        parsedLines.push(currentLine);
      }
    }
    return parsedLines.join("\n");
  }

  public static getIgnoredBlocks(content: string): string {
    const ignoredLines: string[] = [];
    const lines = content.replace(/\@sync ignore/g, "@sync-ignore").split("\n");
    let currentLine = "";
    for (let index = 0; index < lines.length; index++) {
      currentLine = lines[index];
      if (this.ignoreRegex.test(currentLine)) {
        ignoredLines.push(currentLine);
        index = this.checkNextLines(
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

  public static removeAllComments(text: string): string {
    return text.replace(/\s*(\/\/.+)|(\/\*.+\*\/)/g, "");
  }

  private static pragmaRegex: RegExp = /\/{2}[\s\t]*\@sync[\s\t]+(?:os=.+[\s\t]*)?(?:host=.+[\s\t]*)?(?:env=.+[\s\t]*)?/;
  private static ignoreRegex: RegExp = /\/{2}[\s\t]*\@sync-ignore/;
  private static hostRegex = /(?:host=(.+)os=)|(?:host=(.+)env=)|host=(.+)\n?/;
  private static osRegex = /(?:os=(.+)host=)|(?:os=(.+)env=)|os=(.+)\n?/;
  private static envRegex = /(?:env=(.+)host=)|(?:env=(.+)os=)|env=(.+)\n?/;

  private static supportedOS = Object.keys(OperatingSystem)
    .filter(k => !/\d/.test(k))
    .map(k => k.toLowerCase());

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

    if (checkTrailingComma && !currentLine.trim().endsWith(",")) {
      currentLine = `${currentLine.trimRight()},`;
    }

    if (!shouldIgnore) {
      parsedLines.push(this.toggleComments(currentLine, shouldComment));
    }

    const opensCurlyBraces = /{/.test(currentLine);
    const opensBrackets = /".+"\s*:\s*\[/.test(currentLine);

    let openedBlock = opensCurlyBraces || opensBrackets;
    if (openedBlock) {
      while (openedBlock) {
        currentLine = lines[++index];
        if (
          (opensCurlyBraces && currentLine.indexOf("}") !== -1) ||
          (opensBrackets && currentLine.indexOf("]") !== -1)
        ) {
          if (checkTrailingComma && !currentLine.trim().endsWith(",")) {
            currentLine = `${currentLine.trimRight()},`;
          }
          openedBlock = false;
        }
        if (!shouldIgnore) {
          parsedLines.push(this.toggleComments(currentLine, shouldComment));
        }
      }
    }

    return index;
  }

  private static osTypeFromString(osName: string): OperatingSystem {
    const capitalized: string =
      osName[0].toUpperCase() + osName.substr(1).toLowerCase();
    return OperatingSystem[capitalized];
  }
}
