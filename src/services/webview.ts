import set from "lodash/set";
import { resolve } from "path";
import {
	commands,
	env,
	Uri,
	ViewColumn,
	WebviewOptions,
	WebviewPanel,
	WebviewPanelOptions,
	window,
} from "vscode";
import { ISettings, WebviewSection, Syncers, UISettingType } from "~/models";
import {
	Environment,
	FS,
	localize,
	OAuth,
	Settings,
	Watcher,
} from "~/services";
import { merge } from "~/utilities";

// eslint-disable-next-line import/extensions
import webviewContent from "~/../assets/ui/index.html";

export namespace Webview {
	export const openSettingsPage = (settings: ISettings): WebviewPanel => {
		return createPanel({
			data: {
				settings,
				sections: generateSections(settings),
			},
			id: "settings",
			title: "Syncify Settings",
			onMessage: async (message) => {
				if (message === "edit") return Settings.openFile();

				const curSettings = await Settings.get();

				return Settings.set(set(curSettings, message.setting, message.value));
			},
		});
	};

	export const openErrorPage = (error: Error): WebviewPanel => {
		return createPanel({
			data: error.message,
			id: "error",
			title: "Syncify Error",
		});
	};

	export const openLandingPage = (): WebviewPanel => {
		return createPanel({
			id: "landing",
			title: "Welcome to Syncify",
			onMessage: async (message: string) => {
				const settings = await Settings.get();

				switch (message) {
					case "gitlab":
					case "bitbucket":
					case "github": {
						const clientIds = Environment.oauthClientIds;

						const authUrls = {
							github: `https://github.com/login/oauth/authorize?scope=repo%20read:user&client_id=${clientIds.github}`,
							gitlab: `https://gitlab.com/oauth/authorize?client_id=${clientIds.gitlab}&redirect_uri=http://localhost:37468/callback&response_type=token&scope=api+read_repository+read_user+write_repository`,
							bitbucket: `https://bitbucket.org/site/oauth2/authorize?client_id=${clientIds.bitbucket}&response_type=token`,
						};

						await OAuth.listen(37468, message);

						return env.openExternal(Uri.parse(authUrls[message]));
					}

					case "settings":
						return openSettingsPage(settings);

					case "nologin": {
						const result = await window.showInputBox({
							placeHolder: localize(
								"(prompt) webview -> landingPage -> nologin",
							),
						});

						if (!result) return;

						const currentSettings = await Settings.get();

						Watcher.stop();

						await FS.remove(Environment.globalStoragePath);

						await Settings.set({ repo: { url: result } });

						await commands.executeCommand("syncify.download");

						Watcher.stop();

						await FS.remove(Environment.globalStoragePath);

						return Settings.set(currentSettings);
					}

					default:
						break;
				}
			},
		});
	};

	export const openRepositoryCreationPage = (options: {
		token: string;
		user: string;
		provider: string;
	}): WebviewPanel => {
		return createPanel({
			id: "repo",
			title: "Configure Repository",
			data: options,
			onMessage: async (message) => {
				if (message.close && pages.repo) return pages.repo.dispose();

				await Settings.set({
					repo: {
						url: message,
					},
				});
			},
		});
	};

	const pages = {
		landing: undefined as WebviewPanel | undefined,
		repo: undefined as WebviewPanel | undefined,
		settings: undefined as WebviewPanel | undefined,
		error: undefined as WebviewPanel | undefined,
	};

	const createPanel = (options: {
		id: keyof typeof pages;
		data?: any;
		title: string;
		viewColumn?: ViewColumn;
		options?: WebviewPanelOptions & WebviewOptions;
		onMessage?: (message: any) => any;
	}): WebviewPanel => {
		const { id, data = "" } = options;

		const page = pages[id];

		const pwdUri = Uri.file(resolve(Environment.extensionPath, "assets/ui"));

		if (page) {
			page.webview.html = generateContent(
				page.webview.asWebviewUri(pwdUri).toString(),
				page.webview.cspSource,
				id,
				data,
			);

			page.reveal();
			return page;
		}

		const defaultOptions = {
			retainContextWhenHidden: true,
			enableScripts: true,
		};

		const panel = window.createWebviewPanel(
			id,
			options.title,
			options.viewColumn ?? ViewColumn.One,
			merge(defaultOptions, options.options ?? {}),
		);

		panel.webview.html = generateContent(
			panel.webview.asWebviewUri(pwdUri).toString(),
			panel.webview.cspSource,
			id,
			data,
		);

		if (options.onMessage) panel.webview.onDidReceiveMessage(options.onMessage);

		panel.onDidDispose(() => {
			pages[id] = undefined;
		});

		pages[id] = panel;
		return panel;
	};

	const generateContent = (
		pwd: string,
		csp: string,
		id: string,
		data: any,
	): string => {
		return webviewContent
			.replace(/@PWD/g, pwd)
			.replace(/@CSP/g, csp)
			.replace(/@PAGE/g, id)
			.replace(/@DATA/g, encodeURIComponent(JSON.stringify(data)));
	};

	const generateSections = (settings: ISettings): WebviewSection[] => {
		return [
			{
				name: "General",
				settings: [
					{
						name: localize("(setting) syncer -> name"),
						correspondingSetting: "syncer",
						type: UISettingType.Select,
						options: Object.entries(Syncers).map(([key, value]) => ({
							value,
							name: key,
						})),
					},
					{
						name: localize("(setting) hostname -> name"),
						placeholder: localize("(setting) hostname -> placeholder"),
						correspondingSetting: "hostname",
						type: UISettingType.TextInput,
					},
					{
						name: localize("(setting) ignoredItems -> name"),
						placeholder: localize("(setting) ignoredItems -> placeholder"),
						correspondingSetting: "ignoredItems",
						type: UISettingType.TextArea,
					},
					{
						name: localize("(setting) autoUploadDelay -> name"),
						placeholder: localize("(setting) autoUploadDelay -> placeholder"),
						correspondingSetting: "autoUploadDelay",
						type: UISettingType.NumberInput,
						min: 0,
					},
					{
						name: localize("(setting) watchSettings -> name"),
						correspondingSetting: "watchSettings",
						type: UISettingType.Checkbox,
					},
					{
						name: localize("(setting) syncOnStartup -> name"),
						correspondingSetting: "syncOnStartup",
						type: UISettingType.Checkbox,
					},
					{
						name: localize("(setting) forceUpload -> name"),
						correspondingSetting: "forceUpload",
						type: UISettingType.Checkbox,
					},
					{
						name: localize("(setting) forceDownload -> name"),
						correspondingSetting: "forceDownload",
						type: UISettingType.Checkbox,
					},
				],
			},
			{
				name: "Repo Syncer",
				settings: [
					{
						name: localize("(setting) repo.url -> name"),
						placeholder: localize("(setting) repo.url -> placeholder"),
						correspondingSetting: "repo.url",
						type: UISettingType.TextInput,
					},
					{
						name: localize("(setting) repo.currentProfile -> name"),
						correspondingSetting: "repo.currentProfile",
						type: UISettingType.Select,
						options: settings.repo.profiles.map((p) => ({
							name: `${p.name} [branch: ${p.branch}]`,
							value: p.name,
						})),
					},
					{
						name: localize("(setting) repo.profiles -> name"),
						correspondingSetting: "repo.profiles",
						type: UISettingType.ObjectArray,
						newTemplate: {
							branch: "",
							name: "",
						},
						schema: [
							{
								name: localize(
									"(setting) repo.profiles.properties.name -> name",
								),
								placeholder: localize(
									"(setting) repo.profiles.properties.name -> placeholder",
								),
								correspondingSetting: "name",
								type: UISettingType.TextInput,
							},
							{
								name: localize(
									"(setting) repo.profiles.properties.branch -> name",
								),
								placeholder: localize(
									"(setting) repo.profiles.properties.branch -> placeholder",
								),
								correspondingSetting: "branch",
								type: UISettingType.TextInput,
							},
						],
					},
				],
			},
			{
				name: "File Syncer",
				settings: [
					{
						name: localize("(setting) file.path -> name"),
						placeholder: localize("(setting) file.path -> placeholder"),
						correspondingSetting: "file.path",
						type: UISettingType.TextInput,
					},
				],
			},
		];
	};
}
