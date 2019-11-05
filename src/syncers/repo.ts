import { basename, dirname, relative, resolve } from "path";
import createSimpleGit, { SimpleGit } from "simple-git/promise";
import { commands, extensions, ViewColumn, window, workspace } from "vscode";
import { IProfile, ISettings, ISyncer } from "~/models";
import {
  Debug,
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
      await FS.mkdir(Environment.repoFolder);

      await this.git.cwd(Environment.repoFolder);

      const isRepo = await this.git.checkIsRepo();

      if (!isRepo) {
        Debug.log("Repo folder is not a git repo, initializing...");

        await this.git.init();
      }

      const remotes = await this.git.getRemotes(true);
      const origin = remotes.find(remote => remote.name === "origin");

      const settings = await Settings.get();

      if (!origin) {
        Debug.log(`Adding new remote "origin" at "${settings.repo.url}"`);

        await this.git.addRemote("origin", settings.repo.url);
      } else if (origin.refs.push !== settings.repo.url) {
        Debug.log(
          `Wrong remote url for "origin", removing and adding new origin at "${settings.repo.url}"`
        );

        await this.git.removeRemote("origin");
        await this.git.addRemote("origin", settings.repo.url);
      }
    } catch (err) {
      Logger.error(err);
    }
  }

  public async sync(): Promise<void> {
    try {
      if (!(await this.isConfigured())) {
        Webview.openLandingPage();
        return;
      }

      await this.init();

      const [profile, settings] = await Promise.all([
        this.getProfile(),
        Settings.get(),
        this.git.fetch(),
        this.copyFilesToRepo()
      ]);

      const status = await this.getStatus(settings, profile);

      Debug.log(`Current git status: ${status}`);

      const diff = await this.git.diff();

      if (diff && status !== "behind") {
        return this.upload();
      }

      if (status === "behind") {
        return this.download();
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
        if (!(await this.isConfigured())) {
          Webview.openLandingPage();
          return;
        }

        await this.init();

        window.setStatusBarMessage(localize("(info) upload.uploading"), 2000);

        const profile = await this.getProfile();

        await this.git.fetch();

        const status = await this.getStatus(settings, profile);

        Debug.log(`Current git status: ${status}`);

        if (status === "behind" && !settings.forceUpload) {
          window.setStatusBarMessage(
            localize("(info) upload.remoteChanges"),
            2000
          );
          return;
        }

        const branchExists = await this.localBranchExists(profile.branch);

        if (!branchExists) {
          Debug.log(
            `Branch "${profile.branch}" does not exist, creating new branch...`
          );

          await this.git.checkout(["-b", profile.branch]);
        }

        await this.copyFilesToRepo();
        await this.cleanUpRepo();

        const installedExtensions = Extensions.get();

        Debug.log("Installed extensions:", installedExtensions);

        await FS.write(
          resolve(Environment.repoFolder, "extensions.json"),
          JSON.stringify(installedExtensions, null, 2)
        );

        await this.git.add(".");

        const currentChanges = await this.git.diff();

        if (!currentChanges && !settings.forceUpload && branchExists) {
          window.setStatusBarMessage(localize("(info) upload.upToDate"), 2000);
          return;
        }

        await this.git.commit(`Update [${new Date().toLocaleString()}]`);
        await this.git.push("origin", profile.branch);

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
        if (!(await this.isConfigured())) {
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

        Debug.log("Remote branches:", remoteBranches.all);

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

        Debug.log("Local branches:", branches.all);

        await this.git.fetch();

        if (!branches.current || branches.current !== profile.branch) {
          await this.git.clean("f");
          await this.git.checkout(profile.branch);
        } else if (!branches.all.includes(profile.branch)) {
          Debug.log(`Checking out remote branch "origin/${profile.branch}"`);

          await this.git.clean("f");
          await this.git.checkout([
            "-b",
            profile.branch,
            `origin/${profile.branch}`
          ]);
        }

        const stash = await this.git.stash();

        await this.git.pull("origin", profile.branch);

        if (stash.trim() !== "No local changes to save") {
          Debug.log("Reapplying local changes");

          await this.git.stash(["pop"]);
        }

        await this.copyFilesFromRepo(settings);

        const extensionsFromFile = JSON.parse(
          await FS.read(resolve(Environment.userFolder, "extensions.json"))
        );

        Debug.log(
          "Extensions parsed from downloaded file:",
          extensionsFromFile
        );

        await Extensions.install(...Extensions.getMissing(extensionsFromFile));

        if (settings.removeExtensions) {
          const toDelete = Extensions.getUnneeded(extensionsFromFile);

          Debug.log("Extensions to delete:", toDelete);

          if (toDelete.length) {
            const needToReload = toDelete.some(name => {
              const ext = extensions.getExtension(name);
              if (!ext) return false;

              return ext.isActive;
            });

            Debug.log("Need to reload:", needToReload);

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
    const settings = await Settings.get();
    const { profiles, currentProfile } = settings.repo;

    return profiles.find(({ name }) => name === currentProfile) || profiles[0];
  }

  private async copyFilesToRepo(): Promise<void> {
    try {
      const files = await FS.listFiles(Environment.userFolder);

      Debug.log(
        "Files to copy to repo:",
        files.map(f => relative(Environment.userFolder, f))
      );

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

      Debug.log(
        "Files to copy from repo:",
        files.map(f => relative(Environment.repoFolder, f))
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

      Debug.log(
        "Files in the repo folder:",
        repoFiles.map(f => relative(Environment.repoFolder, f))
      );

      Debug.log(
        "Files in the user folder:",
        userFiles.map(f => relative(Environment.userFolder, f))
      );

      const unneeded = repoFiles.filter(f => {
        const correspondingFile = resolve(
          Environment.userFolder,
          relative(Environment.repoFolder, f)
        );
        return !userFiles.includes(correspondingFile);
      });

      Debug.log("Unneeded files:", unneeded);

      await FS.delete(...unneeded);
    } catch (err) {
      Logger.error(err);
    }
  }

  private async getStatus(
    settings: ISettings,
    profile: IProfile
  ): Promise<"ahead" | "behind" | "up-to-date"> {
    const { branch } = profile;
    const { url } = settings.repo;

    const lsRemote = await this.git.listRemote(["--heads", url, branch]);
    const localExists = await this.localBranchExists(branch);

    if (!lsRemote) return "ahead";
    if (!localExists) return "behind";

    const mergeBase = await this.git.raw([
      `merge-base`,
      branch,
      `origin/${branch}`
    ]);

    const revLocal = await this.git.raw([`rev-parse`, branch]);
    const revRemote = await this.git.raw([`rev-parse`, `origin/${branch}`]);

    if (revLocal === revRemote) return "up-to-date";

    if (mergeBase === revRemote) return "ahead";

    if (mergeBase === revLocal) return "behind";

    return "up-to-date";
  }

  private async localBranchExists(branch: string): Promise<boolean> {
    const localBranches = await this.git.branchLocal();
    return localBranches.all.includes(branch);
  }
}
