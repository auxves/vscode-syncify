import glob from "fast-glob";
import fse from "fs-extra";
import { normalize } from "path";
import { Settings } from "~/services";

export namespace FS {
	export async function exists(path: string): Promise<boolean> {
		return fse.pathExists(path);
	}

	export async function mkdir(path: string): Promise<void> {
		return fse.ensureDir(path);
	}

	export async function copy(src: string, dest: string): Promise<void> {
		return fse.copy(src, dest, {
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
		if (asBuffer) return fse.readFile(path);

		return fse.readFile(path, "utf-8");
	}

	export async function write(path: string, data: any): Promise<void> {
		return fse.writeFile(path, data);
	}

	export async function remove(...paths: string[]): Promise<void> {
		await Promise.all(paths.map(async path => fse.remove(path)));
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
