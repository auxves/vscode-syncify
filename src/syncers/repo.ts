import isEqual from "lodash/isEqual";
import { basename, dirname, relative, resolve } from "path";
import createSimpleGit, { SimpleGit } from "simple-git/promise";
import { commands, extensions, ViewColumn, window, workspace } from "vscode";
import { IProfile, ISettings, ISyncer } from "~/models";
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

export class RepoSyncer implements ISyncer {
  private git: SimpleGit = createSimpleGit().silent(true);

  public async init() {
    try {
      const folderExists = await FS.exists(Environment.repoFolder);

      if (!folderExists) await FS.mkdir(Environment.repoFolder);

      await this.git.cwd(Environment.repoFolder);

      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) await this.git.init();

      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === "origin");

      const settings = await Settings.get();

      if (!origin) {
        this.git.addRemote("origin", settings.repo.url);
      } else if (origin.refs.push !== settings.repo.url) {
        await this.git.removeRemote("origin");
        this.git.addRemote("origin", settings.repo.url);
      }

      const gitignorePath = resolve(Environment.repoFolder, ".gitignore");
      const gitignoreExists = await FS.exists(gitignorePath);
      if (!gitignoreExists) {
        await FS.write(gitignorePath, settings.ignoredItems.join("\n"));
      } else {
        const contents = await FS.read(gitignorePath);

        const lines = contents.split("\n");
        const newLines = [
          ...lines,
          ...settings.ignoredItems.filter(val => !lines.includes(val))
        ];

        if (!isEqual(lines, newLines)) {
          await FS.write(gitignorePath, newLines.join("\n"));
        }
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  public async sync(): Promise<void> {
    try {
      const configured = await this.isConfigured();
      if (!configured) {
        Webview.openLandingPage();
        return;
      }

      await this.init();

      await this.copyFilesToRepo();

      const [uploadDiff, , profile] = await Promise.all([
        this.git.diff(),
        this.git.fetch(),
        this.getProfile()
      ]);

      if (uploadDiff) {
        await this.upload();
        return;
      }

      const remoteBranches = await this.git.branch(["-r"]);

      if (remoteBranches.all.length) {
        const downloadDiff = await this.git.diff([`origin/${profile.branch}`]);
        if (downloadDiff) {
          await this.download();
          return;
        }
      }

      window.setStatusBarMessage(localize("(info) sync.nothingToDo"), 2000);
    } catch (err) {
      Logger.error(err);
    }
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

        await this.init();

        window.setStatusBarMessage(localize("(info) upload.uploading"), 2000);

        const profile = await this.getProfile();

        const branches = await this.git.branchLocal();

        const branchIsNew = !branches.all.includes(profile.branch);

        if (branchIsNew) {
          await this.git.checkout(["-b", profile.branch]);
          await this.git.add(".");
          await this.git.commit("Initial");
        }

        await this.copyFilesToRepo();
        await this.cleanUpRepo();

        const installedExtensions = Extensions.get();

        await FS.write(
          resolve(Environment.repoFolder, "extensions.json"),
          JSON.stringify(installedExtensions, null, 2)
        );

        await this.git.add(".");

        const currentChanges = await this.git.diff([profile.branch]);

        if (!currentChanges && !settings.forceUpload && !branchIsNew) {
          window.setStatusBarMessage(localize("(info) upload.upToDate"), 2000);
          return;
        }

        await this.git.commit(`Update [${new Date().toLocaleString()}]`);

        await this.git.push("origin", profile.branch, {
          "--force": null
        });

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

        await this.init();

        window.setStatusBarMessage(
          localize("(info) download.downloading"),
          2000
        );

        const profile = await this.getProfile();

        await this.git.fetch();

        const remoteBranches = await this.git.branch(["-r"]);

        if (!remoteBranches.all.length) {
          window.setStatusBarMessage(
            localize("(info) download.noRemoteBranches"),
            2000
          );
          return;
        }

        const diff = await this.git.diff([`origin/${profile.branch}`]);

        if (!diff && !settings.forceDownload) {
          window.setStatusBarMessage(
            localize("(info) download.upToDate"),
            2000
          );
          return;
        }

        await this.copyFilesToRepo();

        const installedExtensions = Extensions.get();

        await FS.write(
          resolve(Environment.repoFolder, "extensions.json"),
          JSON.stringify(installedExtensions, null, 2)
        );

        const branches = await this.git.branchLocal();

        if (branches.current !== profile.branch) {
          await this.git.add(".");
          await this.git.commit("Reset");
          await this.git.reset("hard");

          if (branches.all.includes(profile.branch)) {
            await this.git.branch(["-D", profile.branch]);
          }

          await this.git.fetch();
          await this.git.checkout(`origin/${profile.branch}`);
        }

        const stash = await this.git.stash();

        await this.git.pull("origin", profile.branch);

        if (stash.trim() !== "No local changes to save") {
          await this.git.stash(["pop"]);
        }

        await this.copyFilesFromRepo(settings);

        const extensionsFromFile = JSON.parse(
          await FS.read(resolve(Environment.userFolder, "extensions.json"))
        );

        await Extensions.install(...Extensions.getMissing(extensionsFromFile));

        if (settings.removeExtensions) {
          const toDelete = Extensions.getUnneeded(extensionsFromFile);

          if (toDelete.length) {
            const needToReload = toDelete.some(name => {
              const ext = extensions.getExtension(name);
              if (!ext) return false;

              return ext.isActive;
            });

            await Extensions.uninstall(...toDelete);

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
    const { currentProfile, profiles, url } = settings.repo;

    return (
      !!url &&
      !!currentProfile &&
      !!profiles.find(({ name }) => name === currentProfile)
    );
  }

  private async getProfile(): Promise<IProfile> {
    const {
      repo: { profiles, currentProfile }
    } = await Settings.get();

    const profile = profiles.find(({ name }) => name === currentProfile);

    return profile || profiles[0];
  }

  private async copyFilesToRepo(): Promise<void> {
    try {
      const files = await FS.listFiles(Environment.userFolder);

      const filesToPragma = ["settings.json", "keybindings.json"];

      await Promise.all(
        files.map(async file => {
          const contents = await FS.read(file);

          const dir = dirname(
            resolve(
              Environment.repoFolder,
              relative(Environment.userFolder, file)
            )
          );

          const dirExists = await FS.exists(dir);

          if (!dirExists) await FS.mkdir(dir);

          const newPath = resolve(dir, basename(file));

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

  private async copyFilesFromRepo(settings: ISettings): Promise<void> {
    try {
      const files = await FS.listFiles(
        Environment.repoFolder,
        settings.ignoredItems.filter(i => !i.includes(Environment.extensionId))
      );

      const filesToPragma = ["settings.json", "keybindings.json"];

      await Promise.all(
        files.map(async file => {
          let contents = await FS.read(file);

          const hasConflict = (c: string) =>
            ["<<<<<<<", "=======", ">>>>>>>"].every(s => c.includes(s));

          if (hasConflict(contents)) {
            await FS.mkdir(Environment.conflictsFolder);

            const tmpPath = resolve(
              Environment.conflictsFolder,
              `${Math.random()}-${basename(file)}`
            );

            await FS.write(tmpPath, contents);

            const doc = await workspace.openTextDocument(tmpPath);

            await window.showTextDocument(doc, ViewColumn.One, true);

            await new Promise(async res => {
              const d = workspace.onDidSaveTextDocument(e => {
                if (e.fileName === doc.fileName && !hasConflict(e.getText())) {
                  commands.executeCommand("workbench.action.closeActiveEditor");
                  d.dispose();
                  res();
                }
              });
            });

            contents = await FS.read(tmpPath);

            await FS.delete(tmpPath);
          }

          const dir = dirname(
            resolve(
              Environment.userFolder,
              relative(Environment.repoFolder, file)
            )
          );

          const dirExists = await FS.exists(dir);

          if (!dirExists) await FS.mkdir(dir);

          const filename = basename(file);

          const newPath = resolve(dir, filename);

          const currentContents = await (async () => {
            const exists = await FS.exists(newPath);

            if (exists) return FS.read(newPath);

            return "{}";
          })();

          if (filesToPragma.includes(filename)) {
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

  private async cleanUpRepo(): Promise<void> {
    try {
      const [repoFiles, userFiles] = await Promise.all([
        FS.listFiles(Environment.repoFolder),
        FS.listFiles(Environment.userFolder)
      ]);

      const unneeded = repoFiles.filter(f => {
        const correspondingFile = resolve(
          Environment.userFolder,
          relative(Environment.repoFolder, f)
        );
        return !userFiles.includes(correspondingFile);
      });

      await FS.delete(...unneeded);
    } catch (err) {
      Logger.error(err);
    }
  }
}
