import AdmZip from "adm-zip";
import axios from "axios";
import { basename, resolve } from "path";
import { commands, extensions, ProgressLocation, Uri, window } from "vscode";
import parseXML from "xml-parser";
import { Debug, Environment, FS, localize } from "~/services";

export class Extensions {
  public static async install(...ids: string[]): Promise<void> {
    await FS.mkdir(Environment.vsixCacheFolder);

    const vsixFiles = await FS.listFiles(Environment.vsixFolder, [])
      .then(files => files.filter(f => ids.includes(basename(f))))
      .then(async files => {
        function getVersion(path: string) {
          const zip = new AdmZip(path);

          return new Promise<string>(res => {
            zip.readAsTextAsync("extension.vsixmanifest", data => {
              res(
                parseXML(data).root.children[0].children[0].attributes.Version
              );
            });
          });
        }

        return Promise.all(
          files.map(async path => {
            const id = basename(path);

            const metaPath = resolve(
              Environment.vsixCacheFolder,
              `${id}.meta.json`
            );

            const metaExists = await FS.exists(metaPath);

            const metadata = metaExists
              ? JSON.parse(await FS.read(metaPath))
              : {};

            return {
              id,
              path: await (async () => {
                const contents = await FS.read(
                  resolve(Environment.vsixFolder, id)
                );

                const trimmedContents = contents.trim();

                const cachePath = resolve(
                  Environment.vsixCacheFolder,
                  `${id}.vsix`
                );

                const cacheExists = await FS.exists(cachePath);

                if (cacheExists) {
                  Debug.log(`Extension "${id}" already in cache`);

                  const version = await getVersion(cachePath);

                  const isDifferent = (() => {
                    if (metadata.version !== version) {
                      return true;
                    }

                    if (metadata.url !== trimmedContents) {
                      return true;
                    }

                    return false;
                  })();

                  if (isDifferent) {
                    Debug.log(
                      `Extension "${id}" is differnet, redownloading...`
                    );

                    const { data } = await axios.get(trimmedContents, {
                      responseType: "arraybuffer"
                    });

                    await FS.write(cachePath, data);

                    metadata.version = version;
                    metadata.url = trimmedContents;

                    await FS.write(metaPath, JSON.stringify(metadata));
                  }
                } else {
                  Debug.log(
                    `Extension "${id}" is not in cache, downloading...`
                  );

                  const { data: zipContents } = await axios.get(
                    trimmedContents,
                    {
                      responseType: "arraybuffer"
                    }
                  );

                  await FS.write(cachePath, zipContents);

                  const version = await getVersion(cachePath);

                  metadata.version = version;
                  metadata.url = trimmedContents;

                  await FS.write(metaPath, JSON.stringify(metadata));
                }

                return Uri.file(cachePath);
              })()
            };
          })
        );
      });

    await window.withProgress(
      {
        location: ProgressLocation.Notification
      },
      async progress => {
        const increment = 100 / ids.length;

        return Promise.all(
          ids.map(async ext => {
            const vsix = vsixFiles.find(f => f.id === ext);

            await commands.executeCommand(
              "workbench.extensions.installExtension",
              vsix ? vsix.path : ext
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
