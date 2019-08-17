import { state } from "@/models";
import glob from "fast-glob";
import { ensureDir, pathExists, readFile, remove, writeFile } from "fs-extra";

export class FileSystemService {
  public exists(path: string): Promise<boolean> {
    return pathExists(path);
  }

  public mkdir(path: string): Promise<void> {
    return ensureDir(path);
  }

  public read(path: string, encoding: string): Promise<Buffer>;
  public read(path: string): Promise<string>;
  public read(
    path: string,
    encoding: string = "utf-8"
  ): Promise<string | Buffer> {
    return readFile(path, encoding);
  }

  public write(path: string, data: any): Promise<void> {
    return writeFile(path, data);
  }

  public delete(...paths: string[]): Promise<void[]> {
    return Promise.all(paths.map(path => remove(path)));
  }

  public async listFiles(
    path: string,
    ignoredItems?: string[]
  ): Promise<string[]> {
    const settings = await state.settings.getSettings();

    return glob(`${path}/**/*`, {
      dot: true,
      ignore: ignoredItems || settings.ignoredItems,
      absolute: true
    });
  }
}
