import { commands, window } from "vscode";
import { Debug, localize, Settings } from "~/services";

export class Profile {
  public static async switch(profile?: string): Promise<void> {
    const repo = await Settings.get(s => s.repo);

    const newProfile = await (async () => {
      if (profile) {
        return repo.profiles.find(prof => prof.name === profile);
      }

      const mappedProfiles = repo.profiles.map(
        prof => `${prof.name} [branch: ${prof.branch}]`
      );

      const selected = await window.showQuickPick(mappedProfiles);

      return repo.profiles.find(
        prof => `${prof.name} [branch: ${prof.branch}]` === selected
      );
    })();

    if (!newProfile) return;

    Debug.log(`Switching to profile:`, newProfile.name);

    await Settings.set({
      repo: {
        currentProfile: newProfile.name
      }
    });

    window.showInformationMessage(
      localize("(info) repo.switchedProfile", newProfile.name)
    );

    await commands.executeCommand("syncify.download");
  }
}
