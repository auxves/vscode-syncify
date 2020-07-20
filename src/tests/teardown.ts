import { remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

export = () => remove(resolve(tmpdir(), "vscode-syncify-tests"));
