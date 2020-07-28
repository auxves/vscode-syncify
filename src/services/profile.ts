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

export const isCurrentValid = async (): Promise<boolean> => {
	try {
		await getCurrent();
		return true;
	} catch {
		return false;
	}
};

export const getCurrent = async (): Promise<Profile> => {
	const { currentProfile } = await Settings.local.get();
	const { profiles } = await Settings.shared.get();

	if (typeof currentProfile !== "string" || currentProfile.length <= 0) {
		throw new Error("invalid current profile");
	}

	const profile = profiles.find(({ name }) => name === currentProfile);

	if (!profile) throw new Error("invalid current profile");

	return profile;
};

export const update = async (name: string, profile: Partial<Profile>) => {
	const { profiles } = await Settings.shared.get();

	const newProfiles = profiles.map((p) => {
		return p.name === name ? { ...p, ...profile } : p;
	});

	await Settings.shared.set({ profiles: newProfiles });
};
