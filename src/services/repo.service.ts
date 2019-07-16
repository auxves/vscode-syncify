import { resolve } from "path";
import createSimpleGit, { SimpleGit } from "simple-git/promise";
import { window } from "vscode";
import { IProfile } from "../models/profile.model";
import { ISyncService } from "../models/sync.model";
import { state } from "../state";

export class RepoService implements ISyncService {
  private git: SimpleGit;

  constructor() {
    this.git = createSimpleGit(state.env.locations.userFolder);
  }

  public async init() {
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      this.git.init();
    }

    const remotes = await this.git.getRemotes(true);
    const origin = remotes.filter(remote => remote.name === "origin")[0];

    const settings = await state.settings.getSettings();

    if (!origin) {
      this.git.addRemote("origin", settings.repo.url);
    } else if (origin.refs.push !== settings.repo.url) {
      await this.git.removeRemote("origin");
      this.git.addRemote("origin", settings.repo.url);
    }

    const gitignorePath = resolve(state.env.locations.userFolder, ".gitignore");
    const exists = await state.fs.exists(gitignorePath);
    if (!exists) {
      await state.fs.write(gitignorePath, settings.ignoredItems.join("\n"));
    } else {
      const contents = await state.fs.read(gitignorePath);
      const lines = contents.split("\n");
      let hasChanged = false;
      settings.ignoredItems.forEach(val => {
        if (!lines.includes(val)) {
          lines.push(val);
          hasChanged = true;
        }
      });
      if (hasChanged) {
        await state.fs.write(gitignorePath, lines.join("\n"));
      }
    }
  }

  public async sync(): Promise<void> {
    const configured = await this.isConfigured();
    if (!configured) {
      return;
    }

    await this.init();

    const [uploadDiff, , profile] = await Promise.all([
      this.git.diff(),
      this.git.fetch(),
      this.getProfile()
    ]);

    if (uploadDiff) {
      await this.upload();
    }

    const downloadDiff = await this.git.diff([`origin/${profile.branch}`]);
    if (downloadDiff) {
      await this.download();
    }
  }

  public async upload(): Promise<void> {
    const configured = await this.isConfigured();
    if (!configured) {
      return;
    }

    await this.init();

    window.setStatusBarMessage("Syncify: Uploading", 2000);

    const profile = await this.getProfile();

    await this.git.add(".");

    await this.git.commit(`Update [${new Date().toLocaleString()}]`);

    await this.git.push("origin", profile.branch, {
      "--force": null
    });

    window.setStatusBarMessage("Syncify: Uploaded", 2000);
  }

  public async download(): Promise<void> {
    const configured = await this.isConfigured();
    if (!configured) {
      return;
    }

    await this.init();

    window.setStatusBarMessage("Syncify: Downloading", 2000);

    const profile = await this.getProfile();

    await this.git.reset("hard");

    await this.git.pull("origin", profile.branch, {
      "--force": null
    });

    window.setStatusBarMessage("Syncify: Downloaded", 2000);
  }

  public async isConfigured(): Promise<boolean> {
    const settings = await state.settings.getSettings();
    return !!settings.repo.url;
  }

  public async reset(): Promise<void> {
    window.showInformationMessage("Syncify: Settings have been reset");
  }

  private async getProfile(): Promise<IProfile> {
    const settings = await state.settings.getSettings();
    const currentProfile = settings.repo.profiles.filter(
      profile => profile.name === settings.repo.currentProfile
    )[0];

    return currentProfile ? currentProfile : settings.repo.profiles[0];
  }
}
