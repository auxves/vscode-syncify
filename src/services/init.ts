import { commands } from "vscode";
import { CustomFiles, Factory, Profile, Settings, Watcher } from "~/services";
import state from "~/state";

export async function init() {
	const settings = await Settings.get();

	const syncer = Factory.generate(settings.syncer);

	Watcher.stop();

	Watcher.init(settings.ignoredItems);

	if (settings.watchSettings) Watcher.start();

	state.context?.subscriptions.forEach(d => d.dispose());

	const cmds = {
		sync: syncer.sync.bind(syncer),
		upload: syncer.upload.bind(syncer),
		download: syncer.download.bind(syncer),
		reset: Settings.reset,
		openSettings: Settings.open,
		reinitialize: init,
		importCustomFile: CustomFiles.importFile,
		registerCustomFile: CustomFiles.registerFile,
		switchProfile: Profile.switchProfile,
		enableDebugMode: () => {
			state.isDebugMode = true;
		},
		disableDebugMode: () => {
			state.isDebugMode = false;
		}
	};

	state.context?.subscriptions.push(
		...Object.entries(cmds).map(([name, fn]) =>
			commands.registerCommand(`syncify.${name}`, fn)
		)
	);

	if (settings.syncOnStartup) await commands.executeCommand("syncify.sync");
}
