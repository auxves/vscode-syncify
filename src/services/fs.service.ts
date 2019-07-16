import { exists, mkdir, readFile, writeFile } from "fs-extra";

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
}
