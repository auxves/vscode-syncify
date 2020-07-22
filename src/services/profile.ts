import { localize, Logger, Settings } from "~/services";
import { Profile } from "~/models";
import { commands, window } from "vscode";

export const switchProfile = async (profileName?: string): Promise<void> => {
	const { profiles } = await Settings.shared.get();
	const { currentProfile } = await Settings.local.get();

	const profile = await (async () => {
		if (profileName) return profiles.find((p) => p.name === profileName);

		const quickPickItems = profiles
			.map((profile) => profile.name)
			.filter((name) => name !== currentProfile);

		const selected = await window.showQuickPick(quickPickItems, {
			placeHolder: localize("(prompt) Profiles.switch -> placeholder"),
		});

		if (!selected) return;

		return profiles.find(({ name }) => name === selected);
	})();

	if (!profile) return;

	Logger.info("Switching to profile:", profile.name);

	await Settings.local.set({ currentProfile: profile.name });

	const result = await window.showInformationMessage(
		localize("(info) Profiles.switch -> download confirmation", profile.name),
		localize("(label) yes"),
	);

	if (result) await commands.executeCommand("syncify.download");
};

export const getCurrent = async (): Promise<Profile | undefined> => {
	const { currentProfile } = await Settings.local.get();
	const { profiles } = await Settings.shared.get();

	if (typeof currentProfile !== "string") return;
	if (currentProfile.length <= 0) return;

	return profiles.find(({ name }) => name === currentProfile);
};

export const update = async (name: string, profile: Partial<Profile>) => {
	const { profiles } = await Settings.shared.get();

	const newProfiles = profiles.map((p) => {
		return p.name === name ? { ...p, ...profile } : p;
	});

	await Settings.shared.set({ profiles: newProfiles });
};
