export type Migration = (previousVersion: string) => void | Promise<void>;

export type Migrations = {
	[key: string]: Migration;
};
