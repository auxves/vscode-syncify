import { basename, dirname, relative, resolve } from "path";
import createSimpleGit, { SimpleGit } from "simple-git/promise";
import {
	commands,
	extensions,
	ProgressLocation,
	ViewColumn,
	window,
	workspace,
} from "vscode";
import { Profile, ISettings, Syncer } from "~/models";
import {
	Environment,
	Extensions,
	FS,
	localize,
	Logger,
	Pragma,
	Settings,
	Watcher,
	Webview,
} from "~/services";
import { checkGit, sleep, stringifyPretty } from "~/utilities";

export class RepoSyncer implements Syncer {
	private readonly git: SimpleGit = createSimpleGit().silent(true);

	async init(): Promise<void> {
		try {
			await FS.mkdir(Environment.repoFolder);

			await this.git.cwd(Environment.repoFolder);

			const isRepo = await this.git.checkIsRepo();

			if (!isRepo) {
				Logger.debug("Repo folder is not a git repo, initializing...");

				await this.git.init();
			}

			const remotes = await this.git.getRemotes(true);
			const origin = remotes.find(remote => remote.name === "origin");

			const repoUrl = await Settings.get(s => s.repo.url);

			if (!origin) {
				Logger.debug(`Adding new remote "origin" at "${repoUrl}"`);

				await this.git.addRemote("origin", repoUrl);
			} else if (origin.refs.push !== repoUrl) {
				Logger.debug(
					`Wrong remote url for "origin", removing and adding new origin at "${repoUrl}"`,
				);

				await this.git.removeRemote("origin");
				await this.git.addRemote("origin", repoUrl);
			}
		} catch (error) {
			Logger.error(error);
		}
	}

	async sync(): Promise<void> {
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
				this.copyFilesToRepo(),
			]);

			const status = await this.getStatus(settings, profile);

			Logger.debug(`Current git status: ${status}`);

			const diff = await this.git.diff();

			if (diff && status !== "behind") return await this.upload();

			if (status === "behind") return await this.download();

			window.setStatusBarMessage(localize("(info) sync -> nothingToDo"), 2000);
		} catch (error) {
			Logger.error(error);
		}
	}

	async upload(): Promise<void> {
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

					progress.report({ message: localize("(info) sync -> uploading") });

					const profile = await this.getProfile();

					await this.git.fetch();

					const status = await this.getStatus(settings, profile);

					Logger.debug(`Current git status: ${status}`);

					if (status === "behind" && !settings.forceUpload) {
						progress.report({ increment: 100 });

						await sleep(10);

						return window.setStatusBarMessage(
							localize("(info) repo -> remoteChanges"),
							2000,
						);
					}

					const branchExists = await this.localBranchExists(profile.branch);

					if (!branchExists) {
						Logger.debug(
							`Branch "${profile.branch}" does not exist, creating new branch...`,
						);

						await this.git.checkout(["-b", profile.branch]);
					}

					await this.copyFilesToRepo();
					await this.cleanUpRepo();

					const installedExtensions = Extensions.get();

					Logger.debug("Installed extensions:", installedExtensions);

					await FS.write(
						resolve(Environment.repoFolder, "extensions.json"),
						stringifyPretty(installedExtensions),
					);

					const currentChanges = await this.git.diff();

					if (!currentChanges && !settings.forceUpload && branchExists) {
						progress.report({ increment: 100 });

						await sleep(10);

						return window.setStatusBarMessage(
							localize("(info) repo -> remoteUpToDate"),
							2000,
						);
					}

					await this.git.add(".");
					await this.git.commit(`Update [${new Date().toLocaleString()}]`);
					await this.git.push("origin", profile.branch);

					progress.report({ increment: 100 });

					await sleep(10);

					window.setStatusBarMessage(localize("(info) sync -> uploaded"), 2000);
				} catch (error) {
					Logger.error(error);
				}
			},
		);

		if (settings.watchSettings) Watcher.start();
	}

	async download(): Promise<void> {
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
						message: localize("(info) sync -> downloading"),
					});

					const profile = await this.getProfile();

					await this.git.fetch();

					const remoteBranches = await this.git.branch(["-r"]);

					Logger.debug("Remote branches:", remoteBranches.all);

					if (remoteBranches.all.length === 0) {
						progress.report({ increment: 100 });

						await sleep(10);

						return window.setStatusBarMessage(
							localize("(info) repo -> noRemoteBranches"),
							2000,
						);
					}

					const diff = await this.git.diff([`origin/${profile.branch}`]);

					if (!diff && !settings.forceDownload) {
						progress.report({ increment: 100 });

						await sleep(10);

						return window.setStatusBarMessage(
							localize("(info) repo -> upToDate"),
							2000,
						);
					}

					await this.copyFilesToRepo();

					const installedExtensions = Extensions.get();

					await FS.write(
						resolve(Environment.repoFolder, "extensions.json"),
						stringifyPretty(installedExtensions),
					);

					const branches = await this.git.branchLocal();

					Logger.debug("Local branches:", branches.all);

					await this.git.fetch();

					if (!branches.current) {
						Logger.debug(`First download, checking out ${profile.branch}`);

						await this.git.clean("f");
						await this.git.checkout(["-f", profile.branch]);
					} else if (!branches.all.includes(profile.branch)) {
						Logger.debug(
							`Checking out remote branch "origin/${profile.branch}"`,
						);

						await this.git.clean("f");
						await this.git.checkout([
							"-f",
							"-b",
							profile.branch,
							`origin/${profile.branch}`,
						]);
					} else if (branches.current !== profile.branch) {
						Logger.debug(`Branch exists, switching to ${profile.branch}`);

						if (await checkGit("2.23.0")) {
							Logger.debug(`Git version is >=2.23.0, using git-switch`);

							await this.git.raw(["switch", "-f", profile.branch]);
						} else {
							Logger.debug(`Git version is <2.23.0, not using git-switch`);

							await this.git.reset(["--hard", "HEAD"]);
							await this.git.checkout(["-f", profile.branch]);
						}
					}

					const stash = await this.git.stash();

					await this.git.pull("origin", profile.branch);

					if (stash.trim() !== "No local changes to save") {
						Logger.debug("Reapplying local changes");

						await this.git.stash(["pop"]);
					}

					await this.copyFilesFromRepo(settings);
					await this.cleanUpUser();

					const extensionsFromFile = JSON.parse(
						await FS.read(resolve(Environment.userFolder, "extensions.json")),
					);

					Logger.debug(
						"Extensions parsed from downloaded file:",
						extensionsFromFile,
					);

					await Extensions.install(
						...Extensions.getMissing(extensionsFromFile),
					);

					const toDelete = Extensions.getUnneeded(extensionsFromFile);

					Logger.debug("Extensions to delete:", toDelete);

					if (toDelete.length !== 0) {
						const needToReload = toDelete.some(
							name => extensions.getExtension(name)?.isActive ?? false,
						);

						Logger.debug("Need to reload:", needToReload);

						await Extensions.uninstall(...toDelete);

						if (needToReload) {
							const yes = localize("(label) yes");
							const result = await window.showInformationMessage(
								localize("(info) sync -> needToReload"),
								yes,
							);

							if (result === yes) {
								commands.executeCommand("workbench.action.reloadWindow");
							}
						}
					}

					progress.report({ increment: 100 });

					await sleep(10);

					window.setStatusBarMessage(
						localize("(info) sync -> downloaded"),
						2000,
					);
				} catch (error) {
					Logger.error(error);
				}
			},
		);

		if (settings.watchSettings) Watcher.start();
	}

	async isConfigured(): Promise<boolean> {
		const { currentProfile, profiles, url } = await Settings.get(s => s.repo);

		return (
			Boolean(url) &&
			Boolean(currentProfile) &&
			Boolean(profiles.find(({ name }) => name === currentProfile))
		);
	}

	private async getProfile(): Promise<Profile> {
		const { currentProfile, profiles } = await Settings.get(s => s.repo);

		return profiles.find(({ name }) => name === currentProfile) ?? profiles[0];
	}

	private async copyFilesToRepo(): Promise<void> {
		try {
			const files = await FS.listFiles(Environment.userFolder);

			Logger.debug(
				"Files to copy to repo:",
				files.map(f => relative(Environment.userFolder, f)),
			);

			await Promise.all(
				files.map(async file => {
					const newPath = resolve(
						Environment.repoFolder,
						relative(Environment.userFolder, file),
					);

					await FS.mkdir(dirname(newPath));

					if (file.endsWith(".json")) {
						return FS.write(newPath, Pragma.outgoing(await FS.read(file)));
					}

					return FS.copy(file, newPath);
				}),
			);
		} catch (error) {
			Logger.error(error);
		}
	}

	private async copyFilesFromRepo(settings: ISettings): Promise<void> {
		try {
			const files = await FS.listFiles(
				Environment.repoFolder,
				settings.ignoredItems.filter(i => !i.includes(Environment.extensionId)),
			);

			Logger.debug(
				"Files to copy from repo:",
				files.map(f => relative(Environment.repoFolder, f)),
			);

			await Promise.all(
				files.map(async file => {
					let contents = await FS.readBuffer(file);

					const hasConflict = (c: string) => {
						const regexes = [/^<{7}$/, /^={7}$/, /^>{7}$/];

						return !c.split("\n").every(v => regexes.every(r => !r.test(v)));
					};

					if (hasConflict(contents.toString())) {
						await FS.mkdir(Environment.conflictsFolder);

						const temporaryPath = resolve(
							Environment.conflictsFolder,
							`${Math.random()}-${basename(file)}`,
						);

						await FS.copy(file, temporaryPath);

						const doc = await workspace.openTextDocument(temporaryPath);

						await window.showTextDocument(doc, ViewColumn.One, true);

						await new Promise(resolve => {
							const d = workspace.onDidSaveTextDocument(document => {
								if (
									document.fileName === doc.fileName &&
									!hasConflict(document.getText())
								) {
									commands.executeCommand("workbench.action.closeActiveEditor");
									d.dispose();
									resolve();
								}
							});
						});

						contents = await FS.readBuffer(temporaryPath);

						await FS.remove(temporaryPath);
					}

					const newPath = resolve(
						Environment.userFolder,
						relative(Environment.repoFolder, file),
					);

					await FS.mkdir(dirname(newPath));

					if (file.endsWith(".json")) {
						const currentContents = await (async () => {
							if (await FS.exists(newPath)) return FS.read(newPath);

							return "{}";
						})();

						const afterPragma = Pragma.incoming(
							contents.toString(),
							settings.hostname,
						);

						if (currentContents !== afterPragma) {
							return FS.write(newPath, afterPragma);
						}

						return;
					}

					return FS.write(newPath, contents);
				}),
			);
		} catch (error) {
			Logger.error(error);
		}
	}

	private async cleanUpRepo(): Promise<void> {
		try {
			const [repoFiles, userFiles] = await Promise.all([
				FS.listFiles(Environment.repoFolder),
				FS.listFiles(Environment.userFolder),
			]);

			Logger.debug(
				"Files in the repo folder:",
				repoFiles.map(f => relative(Environment.repoFolder, f)),
			);

			Logger.debug(
				"Files in the user folder:",
				userFiles.map(f => relative(Environment.userFolder, f)),
			);

			const unneeded = repoFiles.filter(f => {
				const correspondingFile = resolve(
					Environment.userFolder,
					relative(Environment.repoFolder, f),
				);
				return !userFiles.includes(correspondingFile);
			});

			Logger.debug("Unneeded files:", unneeded);

			await FS.remove(...unneeded);
		} catch (error) {
			Logger.error(error);
		}
	}

	private async cleanUpUser(): Promise<void> {
		try {
			const [repoFiles, userFiles] = await Promise.all([
				FS.listFiles(Environment.repoFolder),
				FS.listFiles(Environment.userFolder),
			]);

			Logger.debug(
				"Files in the repo folder:",
				repoFiles.map(f => relative(Environment.repoFolder, f)),
			);

			Logger.debug(
				"Files in the user folder:",
				userFiles.map(f => relative(Environment.userFolder, f)),
			);

			const unneeded = userFiles.filter(f => {
				const correspondingFile = resolve(
					Environment.repoFolder,
					relative(Environment.userFolder, f),
				);
				return !repoFiles.includes(correspondingFile);
			});

			Logger.debug("Unneeded files:", unneeded);

			await FS.remove(...unneeded);
		} catch (error) {
			Logger.error(error);
		}
	}

	private async getStatus(
		settings: ISettings,
		profile: Profile,
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
			`origin/${branch}`,
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
