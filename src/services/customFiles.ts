import { basename, resolve } from "path";
import { QuickPickItem, Uri, window, workspace } from "vscode";
import { Environment, FS, localize, Logger } from "~/services";

export class CustomFiles {
  public static async import(uri?: Uri): Promise<void> {
    try {
      const folderExists = await FS.exists(Environment.customFilesFolder);

      if (!folderExists) {
        await FS.mkdir(Environment.customFilesFolder);
      }

      const allFiles = await FS.listFiles(Environment.customFilesFolder);

      if (!allFiles.length) {
        await window.showInformationMessage(
          localize("(info) customFiles -> noFilesAvailable")
        );
        return;
      }

      const folder = await (async () => {
        if (uri) return uri.fsPath;

        if (!workspace.workspaceFolders) return;

        if (workspace.workspaceFolders.length === 1) {
          return workspace.workspaceFolders[0].uri.fsPath;
        }

        const result = await window.showQuickPick(
          workspace.workspaceFolders.map<QuickPickItem>(f => ({
            label: f.name,
            description: f.uri.fsPath
          })),
          {
            placeHolder: localize(
              "(prompt) customFiles -> import -> folder -> placeholder"
            )
          }
        );

        const selectedWorkspace = workspace.workspaceFolders.find(
          f => f.uri.fsPath === result?.description
        );

        if (!selectedWorkspace) return;

        return selectedWorkspace.uri.fsPath;
      })();

      if (!folder) return;

      const filename = await window.showQuickPick(
        allFiles.map(f => basename(f)),
        {
          placeHolder: localize(
            "(prompt) customFiles -> import -> file -> placeholder"
          )
        }
      );

      if (!filename) return;

      const filepath = resolve(Environment.customFilesFolder, filename);

      const newName = await window.showInputBox({
        prompt: localize("(prompt) customFiles -> import -> file -> name"),
        value: filename
      });

      const contents = await FS.read(filepath, true);
      await FS.write(resolve(folder, newName || filename), contents);
    } catch (err) {
      Logger.error(err);
    }
  }

  public static async register(uri?: Uri) {
    try {
      const folderExists = await FS.exists(Environment.customFilesFolder);

      if (!folderExists) {
        await FS.mkdir(Environment.customFilesFolder);
      }

      const filepath = uri
        ? uri.fsPath
        : await (async () => {
            const result = await window.showOpenDialog({
              canSelectMany: false,
              openLabel: localize("(label) customFiles -> selectFile")
            });

            if (!result) return;

            return result[0].fsPath;
          })();

      if (!filepath) return;

      const filename = basename(filepath);
      const newPath = resolve(Environment.customFilesFolder, filename);

      if (await FS.exists(newPath)) {
        const res = await window.showWarningMessage(
          localize("(prompt) customFiles -> register -> exists"),
          localize("(label) no"),
          localize("(label) yes")
        );

        if (res !== localize("(label) yes")) return;
      }

      const contents = await FS.read(filepath, true);

      await FS.write(newPath, contents);

      await window.showInformationMessage(
        localize("(info) customFiles -> registered", filename)
      );
    } catch (err) {
      Logger.error(err);
    }
  }
}
