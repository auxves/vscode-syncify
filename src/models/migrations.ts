export type Migration = (previousVersion: string) => void | Promise<void>;

export interface Migrations {
	[key: string]: Migration;
}
