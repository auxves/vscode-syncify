import { commands, extensions } from "vscode";

export class ExtensionService {
  public static async installExtension(id: string): Promise<void> {
    return commands.executeCommand("workbench.extensions.installExtension", id);
  }

  public static async uninstallExtension(id: string): Promise<void> {
    return commands.executeCommand(
      "workbench.extensions.uninstallExtension",
      id
    );
  }

  public static getExtensions(): string[] {
    return extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
  }

  public static getMissingExtensions(downloadedExtensions: string[]): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return downloadedExtensions.filter(
      ext => !installedExtensions.includes(ext)
    );
  }

  public static getUnneededExtensions(
    downloadedExtensions: string[]
  ): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return installedExtensions.filter(
      ext => !downloadedExtensions.includes(ext)
    );
  }
}
