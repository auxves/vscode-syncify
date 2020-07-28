export type LocalSettings = {
	/**
	 * The method used to sync your settings.
	 */
	syncer: "git" | "local";

	/**
	 * The profile currently being used.
	 */
	currentProfile: string;

	/**
	 * The path where you want your settings to be saved to.
	 *
	 * - For the `git` syncer, this is the URI of the repository.
	 *
	 * - For the `local` syncer, this is the URI of your export folder.
	 */
	exportPath: string;

	/**
	 * Files that will be uploaded, formatted as an array of globs. If a path matches a listed glob, it will be uploaded.
	 */
	filesToInclude: string[];

	/**
	 * Hostnames are used by `Sync Pragmas` to differentiate between different computers.
	 */
	hostname: string;
};

export const defaultLocalSettings: LocalSettings = {
	syncer: "git",
	currentProfile: "main",
	exportPath: "",
	filesToInclude: ["**/*", "!workspaceStorage", "!globalStorage"],
	hostname: "",
};
