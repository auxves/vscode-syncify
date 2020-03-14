import { remove } from "fs-extra";
import { tmpdir } from "os";
import { resolve } from "path";

export = async () => remove(resolve(tmpdir(), "vscode-syncify-tests"));
