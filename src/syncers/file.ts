import { basename, relative, resolve } from "path";
import { commands, extensions, window } from "vscode";
import { ISettings, ISyncer } from "~/models";
import {
  Environment,
  Extensions,
  FS,
  localize,
  Logger,
  Pragma,
  Settings,
  Watcher,
  Webview
} from "~/services";

export class FileSyncer implements ISyncer {
  public async sync(): Promise<void> {
    window.showInformationMessage(
      "Syncify: Sync is not available for File Syncer yet"
    );
  }

  public async upload(): Promise<void> {
    const settings = await Settings.get();
    Watcher.stop();

    await (async () => {
      try {
        const configured = await this.isConfigured();
        if (!configured) {
          Webview.openLandingPage();
          return;
        }

        window.setStatusBarMessage(localize("(info) upload.uploading"), 2000);

        const installedExtensions = Extensions.get();

        await FS.write(
          resolve(settings.file.path, "extensions.json"),
          JSON.stringify(installedExtensions, null, 2)
        );

        await this.copyFilesToPath(settings);

        window.setStatusBarMessage(localize("(info) upload.uploaded"), 2000);
      } catch (err) {
        Logger.error(err);
      }
    })();

    if (settings.watchSettings) Watcher.start();
  }

  public async download(): Promise<void> {
    const settings = await Settings.get();
    Watcher.stop();

    await (async () => {
      try {
        const configured = await this.isConfigured();
        if (!configured) {
          Webview.openLandingPage();
          return;
        }

        window.setStatusBarMessage(
          localize("(info) download.downloading"),
          2000
        );

        await this.copyFilesFromPath(settings);

        const extensionsFromFile = await (async () => {
          const path = resolve(settings.file.path, "extensions.json");

          const extensionsExist = await FS.exists(path);

          if (!extensionsExist) return [];

          return JSON.parse(await FS.read(path));
        })();

        await Extensions.install(...Extensions.getMissing(extensionsFromFile));

        if (settings.removeExtensions) {
          const toDelete = Extensions.getUnneeded(extensionsFromFile);

          if (toDelete.length) {
            const needToReload = toDelete.some(name => {
              const ext = extensions.getExtension(name);
              return ext ? ext.isActive : false;
            });

            await Extensions.uninstall(...toDelete);

            if (needToReload) {
              const result = await window.showInformationMessage(
                localize("(info) download.needToReload"),
                localize("(btn) yes")
              );

              if (result) {
                commands.executeCommand("workbench.action.reloadWindow");
              }
            }
          }
        }

        window.setStatusBarMessage(
          localize("(info) download.downloaded"),
          2000
        );
      } catch (err) {
        Logger.error(err);
      }
    })();

    if (settings.watchSettings) Watcher.start();
  }

  public async isConfigured(): Promise<boolean> {
    const settings = await Settings.get();
    const { path } = settings.file;

    if (!path) return false;

    const folderExists = await FS.exists(path);
    if (!folderExists) await FS.mkdir(path);

    return true;
  }

  private async copyFilesToPath(settings: ISettings): Promise<void> {
    try {
      const files = await FS.listFiles(Environment.userFolder);

      const filesToPragma = ["settings.json", "keybindings.json"];

      await Promise.all(
        files.map(async file => {
          const contents = await FS.read(file);

          const newPath = resolve(
            settings.file.path,
            relative(Environment.userFolder, file)
          );

          if (filesToPragma.includes(basename(file))) {
            return FS.write(newPath, Pragma.processOutgoing(contents));
          }

          return FS.write(newPath, contents);
        })
      );
    } catch (err) {
      Logger.error(err);
    }
  }

  private async copyFilesFromPath(settings: ISettings): Promise<void> {
    try {
      const files = await FS.listFiles(settings.file.path);

      const filesToPragma = ["settings.json", "keybindings.json"];

      await Promise.all(
        files.map(async file => {
          const contents = await FS.read(file);

          const newPath = resolve(
            Environment.userFolder,
            relative(settings.file.path, file)
          );

          const currentContents = await (async () => {
            if (await FS.exists(newPath)) return FS.read(newPath);

            return "{}";
          })();

          if (filesToPragma.includes(basename(file))) {
            const afterPragma = Pragma.processIncoming(
              settings.hostname,
              contents,
              currentContents
            );

            if (currentContents !== afterPragma) {
              return FS.write(newPath, afterPragma);
            }

            return;
          }

          if (currentContents !== contents) return FS.write(newPath, contents);
        })
      );
    } catch (err) {
      Logger.error(err);
    }
  }
}
