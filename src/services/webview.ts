import merge from "lodash/merge";
import set from "lodash/set";
import { resolve } from "path";
import {
  env,
  Uri,
  ViewColumn,
  WebviewOptions,
  WebviewPanel,
  WebviewPanelOptions,
  window
} from "vscode";
import WebviewPage from "~/../assets/ui/index.html";
import { ISettings, IWebviewSection, Syncer, UISettingType } from "~/models";
import { Environment, localize, OAuth, Settings } from "~/services";

export class Webview {
  public static openSettingsPage(settings: ISettings) {
    const content = this.generateContent({
      "@SETTINGS": JSON.stringify(settings),
      "@SECTIONS": JSON.stringify(this.generateSections(settings))
    });

    return this.createPanel({
      content,
      id: "settings",
      title: "Syncify Settings",
      onMessage: async message => {
        if (message === "edit") return Settings.openFile();

        const curSettings = await Settings.get();

        return Settings.set(set(curSettings, message.setting, message.value));
      }
    });
  }

  public static openErrorPage(error: Error) {
    const content = this.generateContent({
      "@ERROR": JSON.stringify(error.message)
    });

    return this.createPanel({
      content,
      id: "error",
      title: "Syncify Error"
    });
  }

  public static openLandingPage() {
    const content = this.generateContent();

    return this.createPanel({
      content,
      id: "landing",
      title: "Welcome to Syncify",
      onMessage: async (message: string) => {
        const settings = await Settings.get();

        if (message === "settings") return this.openSettingsPage(settings);

        const provider = (() => {
          switch (message) {
            case "gitlab":
              return "gitlab";
            case "bitbucket":
              return "bitbucket";
            case "github":
            default:
              return "github";
          }
        })();

        const clientIds = Environment.oauthClientIds;

        const authUrls = {
          github: `https://github.com/login/oauth/authorize?scope=repo%20read:user&client_id=${clientIds.github}`,
          gitlab: `https://gitlab.com/oauth/authorize?client_id=${clientIds.gitlab}&redirect_uri=http://localhost:37468/callback&response_type=token&scope=api+read_repository+read_user+write_repository`,
          bitbucket: `https://bitbucket.org/site/oauth2/authorize?client_id=${clientIds.bitbucket}&response_type=token`
        };

        await OAuth.listen(37468, provider);

        await env.openExternal(Uri.parse(authUrls[provider]));
      }
    });
  }

  public static openRepositoryCreationPage(options: {
    token: string;
    user: string;
    provider: string;
  }) {
    const content = this.generateContent({ "@AUTH": JSON.stringify(options) });

    return this.createPanel({
      content,
      id: "repo",
      title: "Configure Repository",
      onMessage: async message => {
        if (message.close && this.pages.repo) return this.pages.repo.dispose();

        await Settings.set({
          repo: {
            url: message
          }
        });
      }
    });
  }

  private static pages = {
    landing: null as WebviewPanel | null,
    repo: null as WebviewPanel | null,
    settings: null as WebviewPanel | null,
    error: null as WebviewPanel | null
  };

  private static createPanel(options: {
    id: keyof typeof Webview.pages;
    content: string;
    title: string;
    viewColumn?: ViewColumn;
    options?: WebviewPanelOptions & WebviewOptions;
    onMessage?: (message: any) => any;
  }): WebviewPanel {
    const { id, content } = options;

    const page = this.pages[id];

    if (page) {
      page.webview.html = content;
      page.reveal();
      return page;
    }

    const defaultOpts = {
      retainContextWhenHidden: true,
      enableScripts: true
    };

    const panel = window.createWebviewPanel(
      id,
      options.title,
      options.viewColumn || ViewColumn.One,
      merge(defaultOpts, options.options || {})
    );

    const pwdUri = Uri.file(resolve(Environment.extensionPath, "assets/ui"));

    panel.webview.html = content
      .replace(/@PWD/g, panel.webview.asWebviewUri(pwdUri).toString())
      .replace(/@PAGE/g, id);

    if (options.onMessage) panel.webview.onDidReceiveMessage(options.onMessage);

    panel.onDidDispose(() => {
      this.pages[id] = null;
    });

    this.pages[id] = panel;
    return panel;
  }

  private static generateContent(items: { [key: string]: string } = {}) {
    const toReplace = Object.entries(items).map<[string, string]>(
      ([find, replace]) => [find, escape(replace)]
    );

    return toReplace.reduce(
      (acc, [find, replace]) => acc.replace(new RegExp(find, "g"), replace),
      WebviewPage
    );
  }

  private static generateSections(settings: ISettings): IWebviewSection[] {
    return [
      {
        name: "General",
        settings: [
          {
            name: localize("(setting) syncer.name"),
            correspondingSetting: "syncer",
            type: UISettingType.Select,
            options: Object.entries(Syncer).map(([key, value]) => ({
              value,
              name: key
            }))
          },
          {
            name: localize("(setting) hostname.name"),
            placeholder: localize("(setting) hostname.placeholder"),
            correspondingSetting: "hostname",
            type: UISettingType.TextInput
          },
          {
            name: localize("(setting) ignoredItems.name"),
            placeholder: localize("(setting) ignoredItems.placeholder"),
            correspondingSetting: "ignoredItems",
            type: UISettingType.TextArea
          },
          {
            name: localize("(setting) autoUploadDelay.name"),
            placeholder: localize("(setting) autoUploadDelay.placeholder"),
            correspondingSetting: "autoUploadDelay",
            type: UISettingType.NumberInput
          },
          {
            name: localize("(setting) watchSettings.name"),
            correspondingSetting: "watchSettings",
            type: UISettingType.Checkbox
          },
          {
            name: localize("(setting) removeExtensions.name"),
            correspondingSetting: "removeExtensions",
            type: UISettingType.Checkbox
          },
          {
            name: localize("(setting) syncOnStartup.name"),
            correspondingSetting: "syncOnStartup",
            type: UISettingType.Checkbox
          },
          {
            name: localize("(setting) forceUpload.name"),
            correspondingSetting: "forceUpload",
            type: UISettingType.Checkbox
          },
          {
            name: localize("(setting) forceDownload.name"),
            correspondingSetting: "forceDownload",
            type: UISettingType.Checkbox
          }
        ]
      },
      {
        name: "Repo Syncer",
        settings: [
          {
            name: localize("(setting) repo.url.name"),
            placeholder: localize("(setting) repo.url.placeholder"),
            correspondingSetting: "repo.url",
            type: UISettingType.TextInput
          },
          {
            name: localize("(setting) repo.currentProfile.name"),
            correspondingSetting: "repo.currentProfile",
            type: UISettingType.Select,
            options: settings.repo.profiles.map(p => ({
              name: `${p.name} [branch: ${p.branch}]`,
              value: p.name
            }))
          },
          {
            name: localize("(setting) repo.profiles.name"),
            correspondingSetting: "repo.profiles",
            type: UISettingType.ObjectArray,
            newTemplate: {
              branch: "",
              name: ""
            },
            schema: [
              {
                name: localize("(setting) repo.profiles.properties.name.name"),
                correspondingSetting: "name",
                placeholder: localize(
                  "(setting) repo.profiles.properties.name.placeholder"
                ),
                type: UISettingType.TextInput
              },
              {
                name: localize(
                  "(setting) repo.profiles.properties.branch.name"
                ),
                correspondingSetting: "branch",
                placeholder: localize(
                  "(setting) repo.profiles.properties.branch.placeholder"
                ),
                type: UISettingType.TextInput
              }
            ]
          }
        ]
      },
      {
        name: "File Syncer",
        settings: [
          {
            name: localize("(setting) file.path.name"),
            placeholder: localize("(setting) file.path.placeholder"),
            correspondingSetting: "file.path",
            type: UISettingType.TextInput
          }
        ]
      }
    ];
  }
}
