import { commands, QuickPickItem, window } from "vscode";
import { localize, Logger, Settings } from "~/services";

export class Profile {
  public static async switch(profile?: string): Promise<void> {
    const { profiles, currentProfile } = await Settings.get(s => s.repo);

    const newProfile = await (async () => {
      if (profile) {
        return profiles.find(p => p.name === profile);
      }

      const selected = await window.showQuickPick(
        profiles.map<QuickPickItem>(p => ({
          label: p.name === currentProfile ? `${p.name} [current]` : p.name,
          description: p.branch
        })),
        {
          placeHolder: localize("(prompt) profile -> switch -> placeholder")
        }
      );

      return profiles.find(p => p.name === selected?.label);
    })();

    if (!newProfile) return;

    Logger.debug(`Switching to profile:`, newProfile.name);

    await Settings.set({
      repo: {
        currentProfile: newProfile.name
      }
    });

    window.showInformationMessage(
      localize("(info) repo -> switchedProfile", newProfile.name)
    );

    await commands.executeCommand("syncify.download");
  }
}
