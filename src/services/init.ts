import { commands, Uri } from "vscode";
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
		sync: async () => syncer.sync(),
		upload: async () => syncer.upload(),
		download: async () => syncer.download(),
		reset: async () => Settings.reset(),
		openSettings: async () => Settings.open(),
		reinitialize: async () => init(),
		importCustomFile: async (uri?: Uri) => CustomFiles.importFile(uri),
		registerCustomFile: async (uri?: Uri) => CustomFiles.registerFile(uri),
		switchProfile: async () => Profile.switchProfile(),
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
