import { Profile, Syncers } from "~/models";

export interface ISettings {
	/**
	 * The method used to sync your settings.
	 */
	syncer: Syncers;

	/**
	 * Settings relating to the `Repo` syncer.
	 */
	repo: {
		/**
		 * The path to the Git repository.
		 */
		url: string;

		/**
		 * Profiles can be used to sync different settings for different occasions.
		 */
		profiles: Profile[];

		/**
		 * The profile currently being used.
		 */
		currentProfile: string;
	};

	/**
	 * Settings relating to the `File` syncer.
	 */
	file: {
		/**
		 * The path to the export folder.
		 */
		path: string;
	};

	/**
	 * Items that will not be uploaded, formatted as an array of glob strings. If a path matches a listed glob, it will be ignored.
	 *
	 * See https://en.wikipedia.org/wiki/Glob_%28programming%29 for more information about globs.
	 */
	ignoredItems: string[];

	/**
	 * The amount of time to wait before automatically uploading. This is only used when `#watchSettings` is on.
	 *
	 * @minimum 0
	 */
	autoUploadDelay: number;

	/**
	 * Controls whether or not Syncify will watch for local changes. If true, an upload will occur when settings have changed or an extension has been installed/uninstalled.
	 */
	watchSettings: boolean;

	/**
	 * Controls whether or not Syncify should run the `Sync` command when opening the editor.
	 */
	syncOnStartup: boolean;

	/**
	 * Hostnames are used by `Sync Pragmas` to differentiate between different computers.
	 */
	hostname: string;

	/**
	 * Controls whether or not local settings will be forcefully uploaded, even if remote settings are up to date.
	 */
	forceUpload: boolean;

	/**
	 * Controls whether or not remote settings will be forcefully downloaded, even if local settings are up to date.
	 */
	forceDownload: boolean;
}

export const defaultSettings: ISettings = {
	syncer: Syncers.Repo,
	repo: {
		url: "",
		profiles: [
			{
				branch: "master",
				name: "main"
			}
		],
		currentProfile: "main"
	},
	file: {
		path: ""
	},
	ignoredItems: [
		"**/workspaceStorage",
		"**/globalStorage/state.vscdb*",
		"**/globalStorage/arnohovhannisyan.syncify",
		"**/.git"
	],
	autoUploadDelay: 20,
	watchSettings: false,
	syncOnStartup: false,
	hostname: "",
	forceDownload: false,
	forceUpload: false
};
