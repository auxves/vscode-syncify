import { readFileSync } from "fs-extra";
import has from "lodash/has";
import set from "lodash/set";
import { resolve } from "path";
import { URL } from "url";
import * as vscode from "vscode";
import changes from "~/../assets/release-notes.json";
import {
  ISettings,
  IWebview,
  IWebviewSection,
  state,
  UISettingType
} from "~/models";
import { Environment, localize, OAuth, Settings } from "~/services";

export class Webview {
  public static openSettingsPage(settings: ISettings): vscode.WebviewPanel {
    const webview = this.webviews[1];
    const content: string = this.generateContent({
      settings,
      content: webview.htmlContent,
      items: webview.replaceables
    });
    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }
    const settingsPanel = vscode.window.createWebviewPanel(
      "syncifySettings",
      "Syncify Settings",
      vscode.ViewColumn.One,
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

      this.receiveSettingChange(message);
    });
    webview.webview = settingsPanel;
    settingsPanel.onDidDispose(() => (webview.webview = null));
    return settingsPanel;
  }

  public static updateSettingsPage(settings: ISettings) {
    const webview = this.webviews[1];
    if (webview.webview) {
      webview.webview.webview.html = this.generateContent({
        settings,
        content: webview.htmlContent,
        items: webview.replaceables
      });
    }
  }

  public static async receiveSettingChange(message: {
    command: string;
    text: string;
  }) {
    let value: any = message.text;
    if (message.text === "true" || message.text === "false") {
      value = message.text === "true";
    }

    const settings = await Settings.get();

    if (has(settings, message.command)) {
      set(settings, message.command, value);
      Settings.set(settings);
    }
  }

  public static openLandingPage() {
    const webview = this.webviews[0];
    const releaseNotes = {
      ...changes,
      currentVersion: Environment.pkg.version
    };
    const content: string = this.generateContent({
      releaseNotes,
      content: webview.htmlContent,
      items: webview.replaceables
    });
    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }
    const landingPanel = vscode.window.createWebviewPanel(
      "landingPage",
      "Welcome to Syncify",
      vscode.ViewColumn.One,
      {
        retainContextWhenHidden: true,
        enableScripts: true
      }
    );
    landingPanel.webview.onDidReceiveMessage(async message => {
      const settings = await Settings.get();
      switch (message.command) {
        case "loginWithGitHub":
          OAuth.listen(54321);

          const host = new URL(settings.github.endpoint).hostname;
          vscode.env.openExternal(
            vscode.Uri.parse(
              `https://${host}/login/oauth/authorize?scope=repo%20read:user&client_id=0b56a3589b5582d11832&redirect_uri=http://localhost:54321/callback`
            )
          );
          break;
        case "editConfiguration":
          this.openSettingsPage(settings);
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
    const webview = this.webviews[2];
    const content: string = this.generateContent({
      github: {
        token,
        user,
        host
      },
      content: webview.htmlContent,
      items: webview.replaceables
    });
    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview.webview;
    }
    const repositoryCreationPanel = vscode.window.createWebviewPanel(
      "repositoryCreation",
      "Repository Creation",
      vscode.ViewColumn.One,
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

  public static fetchHTMLContent() {
    this.webviews = this.webviews.map(view => ({
      ...view,
      htmlContent: readFileSync(
        `${state.context.extensionPath}/assets/ui/${view.name}/${view.htmlPath}`,
        "utf-8"
      )
    }));
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
      name: "landing-page",
      htmlPath: "landing-page.html",
      replaceables: [
        {
          find: "@RELEASE_NOTES",
          replace: "releaseNotes"
        }
      ]
    },
    {
      name: "settings",
      htmlPath: "settings.html",
      replaceables: [
        {
          find: "@DATA",
          replace: "settings"
        },
        {
          find: "@MAP",
          replace: Webview.settingsMap
        }
      ]
    },
    {
      name: "repository-creation",
      htmlPath: "repository-creation.html",
      replaceables: [
        {
          find: "@GITHUB",
          replace: "github"
        }
      ]
    }
  ];

  private static generateContent(options: any) {
    const toReplace: object[] = [];
    options.items.forEach(option => {
      if (typeof option.replace === "string") {
        toReplace.push({
          ...option,
          replace: escape(JSON.stringify(options[option.replace]))
        });
      } else {
        toReplace.push({
          find: option.find,
          replace: JSON.stringify(option.replace)
        });
      }
    });
    return toReplace
      .reduce(
        (acc, cur: any) => acc.replace(new RegExp(cur.find, "g"), cur.replace),
        options.content
      )
      .replace(
        new RegExp("@PWD", "g"),
        vscode.Uri.file(resolve(state.context.extensionPath, "assets"))
          .with({
            scheme: "vscode-resource"
          })
          .toString()
      );
  }
}
