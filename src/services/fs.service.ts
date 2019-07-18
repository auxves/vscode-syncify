import {
  copy,
  exists,
  mkdir,
  move,
  readFile,
  remove,
  Stats,
  writeFile
} from "fs-extra";
import minimatch from "minimatch";
import { sep } from "path";
import recursiveRead from "recursive-readdir";
import { state } from "../models/state.model";

export class FileSystemService {
  public exists(path: string): Promise<boolean> {
    return new Promise(res => exists(path, res));
  }

  public mkdir(path: string): Promise<void> {
    return new Promise(res => mkdir(path, () => res()));
  }

  public read(path: string): Promise<string> {
    return new Promise(res => readFile(path, "utf-8", (_, data) => res(data)));
  }

  public write(path: string, data: string): Promise<void> {
    return new Promise(res => writeFile(path, data, () => res()));
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
