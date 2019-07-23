import { basename, relative, resolve } from "path";
import { commands, extensions, ProgressLocation, window } from "vscode";
import { ISettings } from "../../models/settings.model";
import { state } from "../../models/state.model";
import { ISyncService } from "../../models/sync.model";
import { PragmaService } from "../utility/pragma.service";

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
      state.webview.openLandingPage();
      return;
    }

    const settings = await state.settings.getSettings();

    window.setStatusBarMessage(state.localize("info(upload).uploading"), 2000);

    const installedExtensions = extensions.all
      .filter(ext => !ext.packageJSON.isBuiltin)
      .map(ext => ext.id);

    await state.fs.write(
      resolve(settings.file.path, "extensions.json"),
      JSON.stringify(installedExtensions, null, 2)
    );

    await this.copyFilesToPath(settings);

    window.setStatusBarMessage(state.localize("info(upload).uploaded"), 2000);

    if (settings.watchSettings) {
      await state.watcher.startWatching();
    }
  }

  public async download(): Promise<void> {
    state.watcher.stopWatching();

    const configured = await this.isConfigured();
    if (!configured) {
      state.webview.openLandingPage();
      return;
    }

    window.setStatusBarMessage(
      state.localize("info(download).downloading"),
      2000
    );

    const settings = await state.settings.getSettings();

    await this.copyFilesFromPath(settings);

    try {
      const extensionsFromFile = await (async () => {
        const extensionsExist = await state.fs.exists(
          resolve(settings.file.path, "extensions.json")
        );
        if (!extensionsExist) {
          return [];
        }
        return JSON.parse(
          await state.fs.read(resolve(settings.file.path, "extensions.json"))
        );
      })();

      const toInstall = state.extensions.getMissingExtensions(
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
              await state.extensions.installExtension(ext);
              progress.report({
                increment,
                message: state.localize("info(download).installed", ext)
              });
            })
          );
        }
      );

      if (settings.removeExtensions) {
        const toDelete = state.extensions.getUnneededExtensions(
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
                  await state.extensions.uninstallExtension(ext);
                  progress.report({
                    increment,
                    message: state.localize("info(download).uninstalled", ext)
                  });
                })
              );
            }
          );

          if (needToReload) {
            const yes = state.localize("btn(yes)");
            const result = await window.showInformationMessage(
              state.localize("info(download).needToReload"),
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

    window.setStatusBarMessage(
      state.localize("info(download).downloaded"),
      2000
    );

    if (settings.watchSettings) {
      await state.watcher.startWatching();
    }
  }

  public async isConfigured(): Promise<boolean> {
    const settings = await state.settings.getSettings();

    if (!settings.file.path) {
      return false;
    }

    const folderExists = await state.fs.exists(settings.file.path);
    if (!folderExists) {
      await state.fs.mkdir(settings.file.path);
    }

    return true;
  }

  public async reset(): Promise<void> {
    // Add file-specific reset logic
  }

  private async copyFilesToPath(settings: ISettings): Promise<void> {
    const files = await state.fs.listFiles(state.env.locations.userFolder);

    const filesToPragma = ["settings.json", "keybindings.json"];

    await Promise.all(
      files.map(async file => {
        const contents = await state.fs.read(file);
        const newPath = resolve(
          settings.file.path,
          relative(state.env.locations.userFolder, file)
        );

        if (filesToPragma.includes(basename(file))) {
          return state.fs.write(
            newPath,
            PragmaService.processOutgoing(contents)
          );
        }

        return state.fs.write(newPath, contents);
      })
    );
  }

  private async copyFilesFromPath(settings: ISettings): Promise<void> {
    const files = await state.fs.listFiles(settings.file.path);

    const filesToPragma = ["settings.json", "keybindings.json"];

    await Promise.all(
      files.map(async file => {
        const contents = await state.fs.read(file);
        const newPath = resolve(
          state.env.locations.userFolder,
          relative(settings.file.path, file)
        );
        const currentContents = await (async () => {
          const exists = await state.fs.exists(newPath);
          if (exists) {
            return state.fs.read(newPath);
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
            return state.fs.write(newPath, afterPragma);
          }
          return;
        }

        if (currentContents !== contents) {
          return state.fs.write(newPath, contents);
        }
      })
    );
  }
}
