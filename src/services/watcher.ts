import { relative } from "path";
import { commands, Disposable, extensions, window } from "vscode";
import chokidar, { FSWatcher } from "vscode-chokidar";
import { Environment, localize, Logger, Settings } from "~/services";
import { sleep } from "~/utilities";

export namespace Watcher {
	let disposable: Disposable | undefined;
	let watcher: FSWatcher | undefined;

	export const init = (ignoredItems: string[]) => {
		if (watcher) watcher.close();

		watcher = chokidar.watch([], {
			ignored: ignoredItems
		});
	};

	export const start = () => {
		if (!watcher) return;

		stop();

		watcher.add(Environment.userFolder);
		watcher.on("change", async path => {
			Logger.debug(`File change: ${relative(Environment.userFolder, path)}`);

			return upload();
		});

		disposable = extensions.onDidChange(async () => {
			Logger.debug("Extension installed/uninstalled");

			return upload();
		});
	};

	export const stop = () => {
		if (watcher) watcher.close();

		if (disposable) {
			disposable.dispose();
			disposable = undefined;
		}
	};

	const upload = async () => {
		if (!window.state.focused) return;

		const cmds = await commands.getCommands();

		if (cmds.includes("syncify.cancelUpload")) return;

		const delay = await Settings.get(s => s.autoUploadDelay);

		let shouldUpload = true;

		const message = window.setStatusBarMessage(
			localize("(info) watcher -> initiating", delay.toString()),
			5000
		);

		const btn = window.createStatusBarItem(1);

		const disposable = commands.registerCommand("syncify.cancelUpload", () => {
			shouldUpload = false;
			disposable.dispose();
			btn.dispose();
			message.dispose();
		});

		btn.command = "syncify.cancelUpload";
		btn.text = `$(x) ${localize("(command) cancelUpload")}`;
		btn.show();

		await sleep(delay * 1000);

		disposable.dispose();
		btn.dispose();

		if (shouldUpload) commands.executeCommand("syncify.upload");
	};
}
