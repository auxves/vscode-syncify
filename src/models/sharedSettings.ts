import { Profile } from "~/models";
import { Environment } from "~/services";

export type SharedSettings = {
	profiles: Profile[];
};

export const defaultSharedSettings: SharedSettings = {
	profiles: [{ name: "main", extensions: [Environment.extensionId] }],
};
