import { commands, extensions } from "vscode";

export class ExtensionService {
  public async installExtension(id: string): Promise<void> {
    return commands.executeCommand("workbench.extensions.installExtension", id);
  }

  public async uninstallExtension(id: string): Promise<void> {
    return commands.executeCommand(
      "workbench.extensions.uninstallExtension",
      id
    );
  }

  public getMissingExtensions(downloadedExtensions: string[]): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return downloadedExtensions.filter(
      ext => !installedExtensions.includes(ext)
    );
  }

  public getUnneededExtensions(downloadedExtensions: string[]): string[] {
    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);
    return installedExtensions.filter(
      ext => !downloadedExtensions.includes(ext)
    );
  }
}
