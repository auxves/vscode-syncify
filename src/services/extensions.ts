import { commands, extensions, ProgressLocation, window } from "vscode";
import { localize } from "~/services";

export class Extensions {
  public static async install(...ids: string[]): Promise<void> {
    await window.withProgress(
      {
        location: ProgressLocation.Notification
      },
      async progress => {
        const increment = 100 / ids.length;
        return Promise.all(
          ids.map(async ext => {
            await commands.executeCommand(
              "workbench.extensions.installExtension",
              ext
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
