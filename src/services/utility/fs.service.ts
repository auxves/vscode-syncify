import glob from "fast-glob";
import { ensureDir, pathExists, readFile, remove, writeFile } from "fs-extra";
import { Settings } from "~/services";

export class FS {
  public static exists(path: string): Promise<boolean> {
    return pathExists(path);
  }

  public static mkdir(path: string): Promise<void> {
    return ensureDir(path);
  }

  public static read(path: string, encoding: string): Promise<Buffer>;
  public static read(path: string): Promise<string>;
  public static read(
    path: string,
    encoding: string = "utf-8"
  ): Promise<string | Buffer> {
    return readFile(path, encoding);
  }

  public static write(path: string, data: any): Promise<void> {
    return writeFile(path, data);
  }

  public static delete(...paths: string[]): Promise<void[]> {
    return Promise.all(paths.map(path => remove(path)));
  }

  public static async listFiles(
    path: string,
    ignoredItems?: string[]
  ): Promise<string[]> {
    const settings = await Settings.get();

    return glob(`${path}/**/*`, {
      dot: true,
      ignore: ignoredItems || settings.ignoredItems,
      absolute: true
    });
  }
}
