import { EnvironmentService, localize } from "@/services";
import { FS } from "@/services/utility/fs.service";
import { basename, resolve } from "path";
import { Uri, window, workspace } from "vscode";

export class CustomFileService {
  public static async import(): Promise<void> {
    if (!workspace.workspaceFolders.length) {
      return;
    }

    const folderExists = await FS.exists(EnvironmentService.customFilesFolder);

    if (!folderExists) {
      await FS.mkdir(EnvironmentService.customFilesFolder);
    }

    const allFiles = await FS.listFiles(EnvironmentService.customFilesFolder);

    if (!allFiles.length) {
      await window.showInformationMessage(
        localize("(info) customSync.noFiles")
      );
      return;
    }

    const folder = await (async () => {
      if (workspace.workspaceFolders.length === 1) {
        return workspace.workspaceFolders[0].uri.fsPath;
      }

      const result = await window.showQuickPick(
        workspace.workspaceFolders.map(f => f.name),
        {
          placeHolder: localize("(prompt) customFile.import.folderPlaceholder")
        }
      );

      return workspace.workspaceFolders.filter(f => f.name === result)[0].uri
        .fsPath;
    })();

    if (!folder) {
      return;
    }

    const filename = await window.showQuickPick(
      allFiles.map(f => basename(f)),
      {
        placeHolder: localize("(prompt) customFile.import.filePlaceholder")
      }
    );

    if (!filename) {
      return;
    }

    const filepath = resolve(EnvironmentService.customFilesFolder, filename);
    const contents = await FS.read(filepath, null);
    await FS.write(resolve(folder, filename), contents);
  }

  public static async register(uri: Uri) {
    const folderExists = await FS.exists(EnvironmentService.customFilesFolder);

    if (!folderExists) {
      await FS.mkdir(EnvironmentService.customFilesFolder);
    }

    const filepath = uri
      ? uri.fsPath
      : await window.showInputBox({
          prompt: localize("(prompt) customFile.register.filePlaceholder")
        });

    if (!filepath) {
      return;
    }

    const filename = basename(filepath);
    const contents = await FS.read(filepath, null);
    const newPath = resolve(EnvironmentService.customFilesFolder, filename);
    await FS.write(newPath, contents);
    await window.showInformationMessage(
      localize("(info) customFile.registered", filename)
    );
  }
}
