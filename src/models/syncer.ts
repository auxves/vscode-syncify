export type Syncer = {
	init: () => Promise<void>;
	upload: () => Promise<void>;
	download: () => Promise<void>;
	isConfigured: () => Promise<boolean>;
};
