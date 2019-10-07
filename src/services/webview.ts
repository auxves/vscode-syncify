import merge from "lodash/merge";
import set from "lodash/set";
import { resolve } from "path";
import { URL } from "url";
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
import {
  IReplaceable,
  ISettings,
  IWebviewSection,
  UISettingType
} from "~/models";
import { Environment, localize, OAuth, Settings } from "~/services";

const sections: IWebviewSection[] = [
  {
    name: "General",
    settings: [
      {
        name: localize("(setting) syncer.name"),
        placeholder: localize("(setting) syncer.placeholder"),
        correspondingSetting: "syncer",
        type: UISettingType.Select,
        options: [
          {
            name: "Repo",
            value: "repo"
          },
          {
            name: "File",
            value: "file"
          }
        ]
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

export class Webview {
  public static async openSettingsPage(
    settings: ISettings
  ): Promise<WebviewPanel> {
    const content = this.generateContent("settings", [
      ["@SETTINGS", JSON.stringify(settings)],
      ["@SECTIONS", JSON.stringify(sections)]
    ]);

    return this.createPanel({
      content,
      id: "settings",
      title: "Syncify Settings",
      onMessage: message => {
        if (message === "edit") return Settings.openFile();

        return Settings.set(set({}, message.setting, message.value));
      }
    });
  }

  public static async openLandingPage() {
    const content = this.generateContent("landing");

    return this.createPanel({
      content,
      id: "landing",
      title: "Welcome to Syncify",
      onMessage: async message => {
        const settings = await Settings.get();
        switch (message) {
          case "loginWithGitHub":
            await OAuth.listen(37468);

            const host = new URL(settings.github.endpoint).hostname;
            env.openExternal(
              Uri.parse(
                `https://${host}/login/oauth/authorize?scope=repo%20read:user&client_id=0b56a3589b5582d11832`
              )
            );
            break;
          case "openSettings":
            await this.openSettingsPage(settings);
            break;
        }
      }
    });
  }

  public static async openRepositoryCreationPage(options: {
    token: string;
    user: string;
    host: URL;
  }) {
    const content = this.generateContent("repo", [
      ["@GITHUB", JSON.stringify(options)]
    ]);

    return this.createPanel({
      content,
      id: "repo",
      title: "Configure Repository",
      onMessage: async message => {
        if (message.close && this.pages.repo) return this.pages.repo.dispose();

        Settings.set({
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
    settings: null as WebviewPanel | null
  };

  private static createPanel(options: {
    id: keyof typeof Webview.pages;
    content: string;
    title: string;
    viewColumn?: ViewColumn;
    options?: WebviewPanelOptions & WebviewOptions;
    onMessage: (message: any) => any;
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

    panel.webview.html = content;

    panel.webview.onDidReceiveMessage(options.onMessage);
    panel.onDidDispose(() => {
      this.pages[id] = null;
    });

    this.pages[id] = panel;
    return panel;
  }

  private static generateContent(
    page: string,
    replaceables: IReplaceable[] = []
  ): string {
    const toReplace = replaceables.map<[string, string]>(([find, replace]) => [
      find,
      escape(replace)
    ]);

    const assetPath = resolve(Environment.extensionPath, "assets/ui");
    const pwdUri = Uri.file(assetPath).with({ scheme: "vscode-resource" });

    return toReplace
      .reduce(
        (acc, [find, replace]) => acc.replace(new RegExp(find, "g"), replace),
        WebviewPage
      )
      .replace(/@PAGE/g, page)
      .replace(/@PWD/g, pwdUri.toString());
  }
}
