import glob from "fast-glob";
import {
	copy as fseCopy,
	ensureDir as fseEnsureDir,
	pathExists as fsePathExists,
	readFile as fseReadFile,
	remove as fseRemove,
	writeFile as fseWriteFile
} from "fs-extra";
import { normalize } from "path";
import { Settings } from "~/services";

export namespace FS {
	export async function exists(path: string): Promise<boolean> {
		return fsePathExists(path);
	}

	export async function mkdir(path: string): Promise<void> {
		return fseEnsureDir(path);
	}

	export async function copy(src: string, dest: string): Promise<void> {
		return fseCopy(src, dest, {
			overwrite: true,
			recursive: true,
			preserveTimestamps: true
		});
	}

	export function read(path: string): Promise<string>;
	export function read(path: string, asBuffer: true): Promise<Buffer>;
	export async function read(
		path: string,
		asBuffer?: boolean
	): Promise<string | Buffer> {
		if (asBuffer) return fseReadFile(path);

		return fseReadFile(path, "utf-8");
	}

	export async function write(path: string, data: any): Promise<void> {
		return fseWriteFile(path, data);
	}

	export async function remove(...paths: string[]): Promise<void> {
		await Promise.all(paths.map(async path => fseRemove(path)));
	}

	export async function listFiles(
		path: string,
		ignoredItems?: string[]
	): Promise<string[]> {
		const files = await glob("**/*", {
			dot: true,
			ignore: ignoredItems ?? (await Settings.get(s => s.ignoredItems)),
			absolute: true,
			cwd: path
		});

		return files.map(normalize);
	}
}
