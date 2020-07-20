import { Settings } from "~/services";
import { normalize } from "path";
import glob from "fast-glob";
import fse from "fs-extra";

export namespace FS {
	export const exists = async (path: string): Promise<boolean> => {
		return fse.pathExists(path);
	};

	export const mkdir = async (path: string): Promise<void> => {
		return fse.ensureDir(path);
	};

	export const copy = async (src: string, dest: string): Promise<void> => {
		return fse.copy(src, dest, {
			overwrite: true,
			recursive: true,
			preserveTimestamps: true,
		});
	};

	export const read = async (path: string): Promise<string> => {
		return fse.readFile(path, "utf-8");
	};

	export const readBuffer = async (path: string): Promise<Buffer> => {
		return fse.readFile(path);
	};

	export const write = async (path: string, data: any): Promise<void> => {
		return fse.writeFile(path, data);
	};

	export const remove = async (...paths: string[]): Promise<void> => {
		await Promise.all(paths.map(fse.remove));
	};

	export const listFiles = async (path: string, filesToInclude?: string[]) => {
		const src = filesToInclude ?? (await Settings.local.get()).filesToInclude;
		const files = await glob(src, { absolute: true, cwd: path });
		return files.map(normalize);
	};
}
