import { ISettings, ISyncService, state } from "@/models";
import {
  EnvironmentService,
  ExtensionService,
  localize,
  PragmaService,
  SettingsService,
  WebviewService
} from "@/services";
import { FS } from "@/services/utility/fs.service";
import { basename, relative, resolve } from "path";
import { commands, extensions, ProgressLocation, window } from "vscode";

export class FileService implements ISyncService {
  public async sync(): Promise<void> {
    window.showInformationMessage(
      "Syncify: Sync is not available for [File] method yet"
    );
  }

  public async upload(): Promise<void> {
    state.watcher.stopWatching();

    const configured = await this.isConfigured();
    if (!configured) {
      WebviewService.openLandingPage();
      return;
    }

    const settings = await SettingsService.getSettings();

    window.setStatusBarMessage(localize("(info) upload.uploading"), 2000);

    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);

    await FS.write(
      resolve(settings.file.path, "extensions.json"),
      JSON.stringify(installedExtensions, null, 2)
    );

    await this.copyFilesToPath(settings);

    window.setStatusBarMessage(localize("(info) upload.uploaded"), 2000);

    if (settings.watchSettings) {
      await state.watcher.startWatching();
    }
  }

  public async download(): Promise<void> {
    state.watcher.stopWatching();

    const configured = await this.isConfigured();
    if (!configured) {
      WebviewService.openLandingPage();
      return;
    }

    window.setStatusBarMessage(localize("(info) download.downloading"), 2000);

    const settings = await SettingsService.getSettings();

    await this.copyFilesFromPath(settings);

    try {
      const extensionsFromFile = await (async () => {
        const extensionsExist = await FS.exists(
          resolve(settings.file.path, "extensions.json")
        );
        if (!extensionsExist) {
          return [];
        }
        return JSON.parse(
          await FS.read(resolve(settings.file.path, "extensions.json"))
        );
      })();

      const toInstall = ExtensionService.getMissingExtensions(
        extensionsFromFile
      );

      await window.withProgress(
        {
          location: ProgressLocation.Notification
        },
        async progress => {
          const increment = 100 / toInstall.length;
          return Promise.all(
            toInstall.map(async ext => {
              await ExtensionService.installExtension(ext);
              progress.report({
                increment,
                message: localize("(info) download.installed", ext)
              });
            })
          );
        }
      );

      if (settings.removeExtensions) {
        const toDelete = ExtensionService.getUnneededExtensions(
          extensionsFromFile
        );

        if (toDelete.length) {
          const needToReload = toDelete.some(
            ext => extensions.getExtension(ext).isActive
          );

          await window.withProgress(
            {
              location: ProgressLocation.Notification
            },
            async progress => {
              const increment = 100 / toDelete.length;
              return Promise.all(
                toDelete.map(async ext => {
                  await ExtensionService.uninstallExtension(ext);
                  progress.report({
                    increment,
                    message: localize("(info) download.uninstalled", ext)
                  });
                })
              );
            }
          );

          if (needToReload) {
            const yes = localize("(btn) yes");
            const result = await window.showInformationMessage(
              localize("(info) download.needToReload"),
              yes
            );
            if (result === yes) {
              commands.executeCommand("workbench.action.reloadWindow");
            }
          }
        }
      }
    } catch (err) {
      throw err;
    }

    window.setStatusBarMessage(localize("(info) download.downloaded"), 2000);

    if (settings.watchSettings) {
      await state.watcher.startWatching();
    }
  }

  public async isConfigured(): Promise<boolean> {
    const settings = await SettingsService.getSettings();

    if (!settings.file.path) {
      return false;
    }

    const folderExists = await FS.exists(settings.file.path);
    if (!folderExists) {
      await FS.mkdir(settings.file.path);
    }

    return true;
  }

  public async reset(): Promise<void> {
    // Add file-specific reset logic
  }

  private async copyFilesToPath(settings: ISettings): Promise<void> {
    const files = await FS.listFiles(EnvironmentService.userFolder);

    const filesToPragma = ["settings.json", "keybindings.json"];

    await Promise.all(
      files.map(async file => {
        const contents = await FS.read(file);
        const newPath = resolve(
          settings.file.path,
          relative(EnvironmentService.userFolder, file)
        );

        if (filesToPragma.includes(basename(file))) {
          return FS.write(newPath, PragmaService.processOutgoing(contents));
        }

        return FS.write(newPath, contents);
      })
    );
  }

  private async copyFilesFromPath(settings: ISettings): Promise<void> {
    const files = await FS.listFiles(settings.file.path);

    const filesToPragma = ["settings.json", "keybindings.json"];

    await Promise.all(
      files.map(async file => {
        const contents = await FS.read(file);
        const newPath = resolve(
          EnvironmentService.userFolder,
          relative(settings.file.path, file)
        );
        const currentContents = await (async () => {
          const exists = await FS.exists(newPath);
          if (exists) {
            return FS.read(newPath);
          }
          return "{}";
        })();

        if (filesToPragma.includes(basename(file))) {
          const afterPragma = PragmaService.processIncoming(
            currentContents,
            contents,
            settings.hostname
          );
          if (currentContents !== afterPragma) {
            return FS.write(newPath, afterPragma);
          }
          return;
        }

        if (currentContents !== contents) {
          return FS.write(newPath, contents);
        }
      })
    );
  }
}
