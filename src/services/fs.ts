import glob from "fast-glob";
import { ensureDir, pathExists, readFile, remove, writeFile } from "fs-extra";
import { normalize } from "path";
import { Settings } from "~/services";

export class FS {
  public static exists(path: string): Promise<boolean> {
    return pathExists(path);
  }

  public static mkdir(path: string): Promise<void> {
    return ensureDir(path);
  }

  public static read(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  public static readBuffer(path: string): Promise<Buffer> {
    return readFile(path);
  }

  public static write(path: string, data: any): Promise<void> {
    return writeFile(path, data);
  }

  public static async delete(...paths: string[]): Promise<void> {
    await Promise.all(paths.map(path => remove(path)));
  }

  public static async listFiles(
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
