import { ensureDir, pathExists, readFile, remove, writeFile } from "fs-extra";
import minimatch from "minimatch";
import recursiveRead from "recursive-readdir";
import { state } from "../../models/state.model";

export class FileSystemService {
  public exists(path: string): Promise<boolean> {
    return pathExists(path);
  }

  public mkdir(path: string): Promise<void> {
    return ensureDir(path);
  }

  public read(path: string): Promise<string> {
    return readFile(path, "utf-8");
  }

  public write(path: string, data: string): Promise<void> {
    return writeFile(path, data);
  }

  public delete(...paths: string[]): Promise<void[]> {
    return Promise.all(paths.map(path => remove(path)));
  }

  public async listFiles(path: string): Promise<string[]> {
    const settings = await state.settings.getSettings();

    function matcher(file: string) {
      return settings.ignoredItems.some(item => minimatch(file, item));
    }

    return recursiveRead(path, [matcher]);
  }
}
