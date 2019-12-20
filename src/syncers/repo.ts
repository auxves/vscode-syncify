import { basename, dirname, relative, resolve } from "path";
import createSimpleGit, { SimpleGit } from "simple-git/promise";
import {
  commands,
  extensions,
  ProgressLocation,
  ViewColumn,
  window,
  workspace
} from "vscode";
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
import { checkGit, sleep, stringifyPretty } from "~/utilities";

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

    await window.withProgress(
      { location: ProgressLocation.Window },
      async progress => {
        try {
          if (!(await this.isConfigured())) {
            Webview.openLandingPage();
            return;
          }

          await this.init();

          progress.report({ message: localize("(info) upload.uploading") });

          const profile = await this.getProfile();

          await this.git.fetch();

          const status = await this.getStatus(settings, profile);

          Debug.log(`Current git status: ${status}`);

          if (status === "behind" && !settings.forceUpload) {
            progress.report({ increment: 100 });

            await sleep(10);

            return window.setStatusBarMessage(
              localize("(info) upload.remoteChanges"),
              2000
            );
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
            stringifyPretty(installedExtensions)
          );

          const currentChanges = await this.git.diff();

          if (!currentChanges && !settings.forceUpload && branchExists) {
            progress.report({ increment: 100 });

            await sleep(10);

            return window.setStatusBarMessage(
              localize("(info) upload.upToDate"),
              2000
            );
          }

          await this.git.add(".");
          await this.git.commit(`Update [${new Date().toLocaleString()}]`);
          await this.git.push("origin", profile.branch);

          progress.report({ increment: 100 });

          await sleep(10);

          window.setStatusBarMessage(localize("(info) upload.uploaded"), 2000);
        } catch (err) {
          Logger.error(err);
        }
      }
    );

    if (settings.watchSettings) Watcher.start();
  }

  public async download(): Promise<void> {
    const settings = await Settings.get();
    Watcher.stop();

    await window.withProgress(
      { location: ProgressLocation.Window },
      async progress => {
        try {
          if (!(await this.isConfigured())) {
            Webview.openLandingPage();
            return;
          }

          await this.init();

          progress.report({
            message: localize("(info) download.downloading")
          });

          const profile = await this.getProfile();

          await this.git.fetch();

          const remoteBranches = await this.git.branch(["-r"]);

          Debug.log("Remote branches:", remoteBranches.all);

          if (!remoteBranches.all.length) {
            progress.report({ increment: 100 });

            await sleep(10);

            return window.setStatusBarMessage(
              localize("(info) download.noRemoteBranches"),
              2000
            );
          }

          const diff = await this.git.diff([`origin/${profile.branch}`]);

          if (!diff && !settings.forceDownload) {
            progress.report({ increment: 100 });

            await sleep(10);

            return window.setStatusBarMessage(
              localize("(info) download.upToDate"),
              2000
            );
          }

          await this.copyFilesToRepo();

          const installedExtensions = Extensions.get();

          await FS.write(
            resolve(Environment.repoFolder, "extensions.json"),
            stringifyPretty(installedExtensions)
          );

          const branches = await this.git.branchLocal();

          Debug.log("Local branches:", branches.all);

          await this.git.fetch();

          if (!branches.current) {
            Debug.log(`First download, checking out ${profile.branch}`);

            await this.git.clean("f");
            await this.git.checkout(["-f", profile.branch]);
          } else if (!branches.all.includes(profile.branch)) {
            Debug.log(`Checking out remote branch "origin/${profile.branch}"`);

            await this.git.clean("f");
            await this.git.checkout([
              "-f",
              "-b",
              profile.branch,
              `origin/${profile.branch}`
            ]);
          } else if (branches.current !== profile.branch) {
            Debug.log(`Branch exists, switching to ${profile.branch}`);

            if (await checkGit("2.23.0")) {
              Debug.log(`Git version is >=2.23.0, using git-switch`);

              await this.git.raw(["switch", "-f", profile.branch]);
            } else {
              Debug.log(`Git version is <2.23.0, not using git-switch`);

              await this.git.reset(["--hard", "HEAD"]);
              await this.git.checkout(["-f", profile.branch]);
            }
          }

          const stash = await this.git.stash();

          await this.git.pull("origin", profile.branch);

          if (stash.trim() !== "No local changes to save") {
            Debug.log("Reapplying local changes");

            await this.git.stash(["pop"]);
          }

          await this.copyFilesFromRepo(settings);
          await this.cleanUpUser();

          const extensionsFromFile = JSON.parse(
            await FS.read(resolve(Environment.userFolder, "extensions.json"))
          );

          Debug.log(
            "Extensions parsed from downloaded file:",
            extensionsFromFile
          );

          await Extensions.install(
            ...Extensions.getMissing(extensionsFromFile)
          );

          if (settings.removeExtensions) {
            const toDelete = Extensions.getUnneeded(extensionsFromFile);

            Debug.log("Extensions to delete:", toDelete);

            if (toDelete.length) {
              const needToReload = toDelete.some(
                name => extensions.getExtension(name)?.isActive ?? false
              );

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

          progress.report({ increment: 100 });

          await sleep(10);

          window.setStatusBarMessage(
            localize("(info) download.downloaded"),
            2000
          );
        } catch (err) {
          Logger.error(err);
        }
      }
    );

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

    return profiles.find(({ name }) => name === currentProfile) ?? profiles[0];
  }

  private async copyFilesToRepo(): Promise<void> {
    try {
      const files = await FS.listFiles(Environment.userFolder);

      Debug.log(
        "Files to copy to repo:",
        files.map(f => relative(Environment.userFolder, f))
      );

      await Promise.all(
        files.map(async file => {
          const newPath = resolve(
            Environment.repoFolder,
            relative(Environment.userFolder, file)
          );

          await FS.mkdir(dirname(newPath));

          if (/\.json$/.test(file)) {
            return FS.write(
              newPath,
              Pragma.processOutgoing(await FS.read(file))
            );
          }

          return FS.cp(file, newPath);
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

      await Promise.all(
        files.map(async file => {
          let contents = await FS.readBuffer(file);

          const hasConflict = (c: string) => {
            const regexes = [/^<<<<<<<$/, /^=======$/, /^>>>>>>>$/];

            return !c.split("\n").every(v => regexes.every(r => !r.test(v)));
          };

          if (hasConflict(contents.toString())) {
            await FS.mkdir(Environment.conflictsFolder);

            const tmpPath = resolve(
              Environment.conflictsFolder,
              `${Math.random()}-${basename(file)}`
            );

            await FS.cp(file, tmpPath);

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

            contents = await FS.readBuffer(tmpPath);

            await FS.delete(tmpPath);
          }

          const newPath = resolve(
            Environment.userFolder,
            relative(Environment.repoFolder, file)
          );

          await FS.mkdir(dirname(newPath));

          if (/\.json$/.test(file)) {
            const currentContents = await (async () => {
              if (await FS.exists(newPath)) return FS.read(newPath);

              return "{}";
            })();

            const afterPragma = Pragma.processIncoming(
              settings.hostname,
              contents.toString(),
              currentContents
            );

            if (currentContents !== afterPragma) {
              return FS.write(newPath, afterPragma);
            }

            return;
          }

          return FS.write(newPath, contents);
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

  private async cleanUpUser(): Promise<void> {
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

      const unneeded = userFiles.filter(f => {
        const correspondingFile = resolve(
          Environment.repoFolder,
          relative(Environment.userFolder, f)
        );
        return !repoFiles.includes(correspondingFile);
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
