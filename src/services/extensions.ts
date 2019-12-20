import { basename } from "path";
import { commands, extensions, ProgressLocation, Uri, window } from "vscode";
import { Environment, FS, localize } from "~/services";

export class Extensions {
  public static async install(...ids: string[]): Promise<void> {
    const vsixFiles = await FS.listFiles(Environment.vsixFolder, []);

    await window.withProgress(
      {
        location: ProgressLocation.Notification
      },
      async progress => {
        const increment = 100 / ids.length;

        return Promise.all(
          ids.map(async ext => {
            const vsix = vsixFiles.find(file =>
              new RegExp(`^${ext}(-\d+?\.\d+?\.\d+?)?.vsix$`, "i").test(
                basename(file)
              )
            );

            await commands.executeCommand(
              "workbench.extensions.installExtension",
              vsix ? Uri.file(vsix) : ext
            );

            progress.report({
              increment,
              message: localize("(info) download.installed", ext)
            });
          })
        );
      }
    );
  }

  public static async uninstall(...ids: string[]): Promise<void> {
    await window.withProgress(
      {
        location: ProgressLocation.Notification
      },
      async progress => {
        const increment = 100 / ids.length;

        return Promise.all(
          ids.map(async ext => {
            await commands.executeCommand(
              "workbench.extensions.uninstallExtension",
              ext
            );

            progress.report({
              increment,
              message: localize("(info) download.uninstalled", ext)
            });
          })
        );
      }
    );
  }

  public static get(): string[] {
    return extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
  }

  public static getMissing(downloadedExtensions: string[]): string[] {
    const installed = Extensions.get();
    return downloadedExtensions.filter(ext => !installed.includes(ext));
  }

  public static getUnneeded(downloadedExtensions: string[]): string[] {
    return Extensions.get().filter(ext => !downloadedExtensions.includes(ext));
  }
}
