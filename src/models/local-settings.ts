export type LocalSettings = {
	/**
	 * The method used to sync your settings.
	 */
	syncer: "git" | "file";

	/**
	 * The profile currently being used.
	 */
	currentProfile: string;

	/**
	 * The path where you want your settings to be saved to.
	 *
	 * - For the `git` syncer, this is the URI of the repository.
	 *
	 * - For the `file` syncer, this is the URI of your export folder.
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

	/**
	 * Controls whether or not local settings will be forcefully uploaded, even if remote settings are up to date or there are newer remote changes.
	 */
	forceUpload: boolean;

	/**
	 * Controls whether or not remote settings will be forcefully downloaded, even if local settings are up to date.
	 */
	forceDownload: boolean;
};

export const defaultLocalSettings: LocalSettings = {
	syncer: "git",
	currentProfile: "main",
	exportPath: "",
	filesToInclude: ["**/*", "!workspaceStorage", "!globalStorage"],
	hostname: "",
	forceDownload: false,
	forceUpload: false,
};
