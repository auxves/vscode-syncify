import { commands, extensions, ProgressLocation, window } from "vscode";
import { localize } from "~/services";

export class Extensions {
  public static async install(...ids: string[]): Promise<void> {
    const opts = {
      location: ProgressLocation.Notification
    };

    await window.withProgress(opts, async progress => {
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
    });
  }

  public static async uninstall(...ids: string[]): Promise<void> {
    const opts = {
      location: ProgressLocation.Notification
    };

    await window.withProgress(opts, async progress => {
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
    });
  }

  public static get(): string[] {
    return extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
  }

  public static getMissing(downloadedExtensions: string[]): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return downloadedExtensions.filter(
      ext => !installedExtensions.includes(ext)
    );
  }

  public static getUnneeded(downloadedExtensions: string[]): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return installedExtensions.filter(
      ext => !downloadedExtensions.includes(ext)
    );
  }
}
