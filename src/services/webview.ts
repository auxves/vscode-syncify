import set from "lodash/set";
import { resolve } from "path";
import { URL } from "url";
import { env, Uri, ViewColumn, WebviewPanel, window } from "vscode";
import LandingPage from "~/../assets/ui/landing/landing.html";
import RepositoryCreationPage from "~/../assets/ui/repository-creation/repository-creation.html";
import SettingsPage from "~/../assets/ui/settings/settings.html";
import {
  IGenerationOptions,
  ISettings,
  IWebview,
  IWebviewSection,
  UISettingType
} from "~/models";
import { Environment, localize, OAuth, Settings } from "~/services";

export class Webview {
  public static async openSettingsPage(
    settings: ISettings
  ): Promise<WebviewPanel> {
    const webview = Webview.webviews[1];

    const content = Webview.generateContent({
      settings: JSON.stringify(settings),
      sections: JSON.stringify(Webview.sections),
      content: webview.html,
      items: webview.replaceables
    });

    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }

    const settingsPanel = window.createWebviewPanel(
      "syncifySettings",
      "Syncify Settings",
      ViewColumn.One,
      {
        retainContextWhenHidden: true,
        enableScripts: true
      }
    );

    settingsPanel.webview.html = content;
    settingsPanel.webview.onDidReceiveMessage(message => {
      if (message === "edit") {
        return Settings.openFile();
      }

      Webview.receiveSettingChange(message);
    });

    webview.webview = settingsPanel;
    settingsPanel.onDidDispose(() => (webview.webview = null));
    return settingsPanel;
  }

  public static async receiveSettingChange(message: {
    setting: string;
    value: string;
  }) {
    await Settings.set(set({}, message.setting, message.value));
  }

  public static async openLandingPage() {
    const webview = Webview.webviews[0];

    const content = Webview.generateContent({
      content: webview.html,
      items: webview.replaceables
    });

    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }

    const landingPanel = window.createWebviewPanel(
      "landingPage",
      "Welcome to Syncify",
      ViewColumn.One,
      {
        retainContextWhenHidden: true,
        enableScripts: true
      }
    );

    landingPanel.webview.onDidReceiveMessage(async message => {
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
          await Webview.openSettingsPage(settings);
          break;
      }
    });

    landingPanel.webview.html = content;
    webview.webview = landingPanel;
    landingPanel.onDidDispose(() => (webview.webview = null));
    return landingPanel;
  }

  public static async openRepositoryCreationPage(
    token: string,
    user: string,
    host: URL
  ) {
    const webview = Webview.webviews[2];

    const content = Webview.generateContent({
      github: JSON.stringify({
        token,
        user,
        host
      }),
      content: webview.html,
      items: webview.replaceables
    });

    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }

    const repositoryCreationPanel = window.createWebviewPanel(
      "repositoryCreation",
      "Repository Creation",
      ViewColumn.One,
      {
        retainContextWhenHidden: true,
        enableScripts: true
      }
    );

    repositoryCreationPanel.webview.onDidReceiveMessage(async message => {
      if (message.close) {
        return repositoryCreationPanel.dispose();
      }
      Settings.set({
        repo: {
          url: message
        }
      });
    });

    repositoryCreationPanel.webview.html = content;
    webview.webview = repositoryCreationPanel;
    repositoryCreationPanel.onDidDispose(() => (webview.webview = null));
    return repositoryCreationPanel;
  }

  private static sections: IWebviewSection[] = [
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

  private static webviews: IWebview[] = [
    {
      html: LandingPage,
      replaceables: [["@CHANGES", "changes"], ["@VERSION", "version"]]
    },
    {
      html: SettingsPage,
      replaceables: [["@SETTINGS", "settings"], ["@SECTIONS", "sections"]]
    },
    {
      html: RepositoryCreationPage,
      replaceables: [["@GITHUB", "github"]]
    }
  ];

  private static generateContent(options: IGenerationOptions): string {
    const toReplace = options.items.map<[string, string]>(([find, replace]) => [
      find,
      escape(options[replace])
    ]);

    return toReplace
      .reduce(
        (acc, [find, replace]) => acc.replace(new RegExp(find, "g"), replace),
        options.content
      )
      .replace(
        /@PWD/g,
        Uri.file(resolve(Environment.extensionPath, "assets/ui"))
          .with({
            scheme: "vscode-resource"
          })
          .toString()
      );
  }
}
