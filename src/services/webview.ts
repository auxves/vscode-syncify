import has from "lodash/has";
import set from "lodash/set";
import { resolve } from "path";
import { URL } from "url";
import { env, Uri, ViewColumn, WebviewPanel, window } from "vscode";
import {
  ISettings,
  IWebview,
  IWebviewSection,
  state,
  UISettingType
} from "~/models";
import { Environment, localize, OAuth, Settings } from "~/services";

import LandingPage from "~/../assets/ui/landing/landing.html";
import RepositoryCreationPage from "~/../assets/ui/repository-creation/repository-creation.html";
import SettingsPage from "~/../assets/ui/settings/settings.html";

import changes from "~/../assets/release-notes.json";

export class Webview {
  public static async openSettingsPage(
    settings: ISettings
  ): Promise<WebviewPanel> {
    const webview = Webview.webviews[1];

    const content: string = Webview.generateContent({
      settings,
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
        return Settings.openSettingsFile();
      }

      Webview.receiveSettingChange(message);
    });

    webview.webview = settingsPanel;
    settingsPanel.onDidDispose(() => (webview.webview = null));
    return settingsPanel;
  }

  public static updateSettingsPage(settings: ISettings) {
    const webview = Webview.webviews[1];

    if (webview.webview) {
      webview.webview.webview.html = Webview.generateContent({
        settings,
        content: webview.html,
        items: webview.replaceables
      });
    }
  }

  public static async receiveSettingChange(message: {
    setting: string;
    value: string;
  }) {
    const settings = await Settings.get();

    if (has(settings, message.setting)) {
      set(settings, message.setting, message.value);
      Settings.set(settings);
    }
  }

  public static async openLandingPage() {
    const webview = Webview.webviews[0];

    const content: string = Webview.generateContent({
      changes,
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
          OAuth.listen(54321);

          const host = new URL(settings.github.endpoint).hostname;
          env.openExternal(
            Uri.parse(
              `https://${host}/login/oauth/authorize?scope=repo%20read:user&client_id=0b56a3589b5582d11832&redirect_uri=http://localhost:54321/callback`
            )
          );
          break;
        case "editConfiguration":
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

    const content: string = Webview.generateContent({
      github: {
        token,
        user,
        host
      },
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

  private static settingsMap: IWebviewSection[] = [
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
          placeholder: "",
          correspondingSetting: "watchSettings",
          type: UISettingType.Checkbox
        },
        {
          name: localize("(setting) removeExtensions.name"),
          placeholder: "",
          correspondingSetting: "removeExtensions",
          type: UISettingType.Checkbox
        },
        {
          name: localize("(setting) syncOnStartup.name"),
          placeholder: "",
          correspondingSetting: "syncOnStartup",
          type: UISettingType.Checkbox
        },
        {
          name: localize("(setting) forceUpload.name"),
          placeholder: "",
          correspondingSetting: "forceUpload",
          type: UISettingType.Checkbox
        },
        {
          name: localize("(setting) forceDownload.name"),
          placeholder: "",
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
      replaceables: [
        {
          find: "@CHANGES",
          replace: "=changes"
        },
        {
          find: "@VERSION",
          replace: Environment.pkg.version
        }
      ]
    },
    {
      html: SettingsPage,
      replaceables: [
        {
          find: "@SETTINGS",
          replace: "=settings"
        },
        {
          find: "@SECTIONS",
          replace: Webview.settingsMap
        }
      ]
    },
    {
      html: RepositoryCreationPage,
      replaceables: [
        {
          find: "@GITHUB",
          replace: "=github"
        }
      ]
    }
  ];

  private static generateContent(options: any) {
    const toReplace: object[] = [];
    options.items.forEach(option => {
      if (
        typeof option.replace === "string" &&
        option.replace.startsWith("=")
      ) {
        toReplace.push({
          ...option,
          replace: escape(JSON.stringify(options[option.replace.slice(1)]))
        });
      } else {
        toReplace.push({
          find: option.find,
          replace: escape(JSON.stringify(option.replace))
        });
      }
    });
    return toReplace
      .reduce(
        (acc, cur: any) => acc.replace(new RegExp(cur.find, "g"), cur.replace),
        options.content
      )
      .replace(
        /@PWD/g,
        Uri.file(resolve(state.context.extensionPath, "assets/ui"))
          .with({
            scheme: "vscode-resource"
          })
          .toString()
      );
  }
}
