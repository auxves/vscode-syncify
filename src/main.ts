import { CustomFiles, initLocalization, Profiles, Settings } from "~/services";
import { ExtensionContext, commands } from "vscode";
import { RootSyncer } from "~/syncers";
import state from "~/state";

export const activate = async (context: ExtensionContext) => {
	state.context = context;

	await initLocalization();

	const rootSyncer = new RootSyncer();

	const init = async () => {
		const settings = await Settings.local.get();
		await rootSyncer.init(settings.syncer);
	};

	const cmds = {
		upload: rootSyncer.upload,
		download: rootSyncer.download,
		reset: Settings.reset,
		openSettings: Settings.open,
		reinitialize: init,
		importCustomFile: CustomFiles.importFile,
		registerCustomFile: CustomFiles.registerFile,
		switchProfile: Profiles.switchProfile,
	};

	const disposables = Object.entries(cmds).map(([name, fn]) => {
		return commands.registerCommand(`syncify.${name}`, fn);
	});

	state.context.subscriptions.push(...disposables);

	await init();
};
