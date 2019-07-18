import { readFileSync } from "fs-extra";
import { has, set } from "lodash";
import { resolve } from "path";
import { URL } from "url";
import * as vscode from "vscode";
import changes from "../../assets/ui/release-notes.json";
import { UISettingType } from "../models/setting-type.model";
import { ISettings } from "../models/settings.model";
import { state } from "../models/state.model";
import { IWebviewSetting } from "../models/webview-setting.model";
import { IWebview } from "../models/webview.model";
import { GitHubOAuthService } from "./github.oauth.service";

export class WebviewService {
  private settingsMap: IWebviewSetting[] = [
    {
      name: state.localize("setting(method).name"),
      placeholder: state.localize("setting(method).placeholder"),
      correspondingSetting: "method",
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
      name: state.localize("setting(hostname).name"),
      placeholder: state.localize("setting(hostname).placeholder"),
      correspondingSetting: "hostname",
      type: UISettingType.TextInput
    },
    {
      name: state.localize("setting(repo.url).name"),
      placeholder: state.localize("setting(repo.url).placeholder"),
      correspondingSetting: "repo.url",
      type: UISettingType.TextInput
    },
    {
      name: state.localize("setting(file.path).name"),
      placeholder: state.localize("setting(file.path).placeholder"),
      correspondingSetting: "file.path",
      type: UISettingType.TextInput
    },
    {
      name: state.localize("setting(ignoredItems).name"),
      placeholder: state.localize("setting(ignoredItems).placeholder"),
      correspondingSetting: "ignoredItems",
      type: UISettingType.TextArea
    },
    {
      name: state.localize("setting(autoUploadDelay).name"),
      placeholder: state.localize("setting(autoUploadDelay).placeholder"),
      correspondingSetting: "autoUploadDelay",
      type: UISettingType.NumberInput
    },
    {
      name: state.localize("setting(watchSettings).name"),
      placeholder: "",
      correspondingSetting: "watchSettings",
      type: UISettingType.Checkbox
    },
    {
      name: state.localize("setting(removeExtensions).name"),
      placeholder: "",
      correspondingSetting: "removeExtensions",
      type: UISettingType.Checkbox
    },
    {
      name: state.localize("setting(syncOnStartup).name"),
      placeholder: "",
      correspondingSetting: "syncOnStartup",
      type: UISettingType.Checkbox
    }
  ];

  private webviews: IWebview[] = [
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
          replace: this.settingsMap
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

  constructor() {
    this.webviews = this.webviews.map(view => {
      return {
        ...view,
        htmlContent: readFileSync(
          `${state.context.extensionPath}/assets/ui/${view.name}/${view.htmlPath}`,
          "utf-8"
        )
      };
    });
  }

  public openSettingsPage(settings: ISettings): vscode.WebviewPanel {
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
    settingsPanel.webview.onDidReceiveMessage(async message => {
      if(message === "edit") {
        state.settings.openSettingsFile();
        return;
      }
      this.receiveSettingChange(message, settings);
    });
    webview.webview = settingsPanel;
    settingsPanel.onDidDispose(() => (webview.webview = null));
    return settingsPanel;
  }

  public updateSettingsPage(settings: ISettings) {
    const webview = this.webviews[1];
    if (webview.webview) {
      webview.webview.webview.html = this.generateContent({
        settings,
        content: webview.htmlContent,
        items: webview.replaceables
      });
    }
  }

  public receiveSettingChange(
    message: {
      command: string;
      text: string;
    },
    settings: ISettings
  ) {
    let value: any = message.text;
    if (message.text === "true" || message.text === "false") {
      value = message.text === "true";
    }
    if (has(settings, message.command)) {
      set(settings, message.command, value);
      state.settings.setSettings(settings);
    }
  }

  public openLandingPage() {
    const webview = this.webviews[0];
    const releaseNotes = {
      ...changes,
      currentVersion: vscode.extensions.getExtension("arnohovhannisyan.syncify")
        .packageJSON.version
    };
    const content: string = this.generateContent({
      releaseNotes,
      content: webview.htmlContent,
      items: webview.replaceables
    });
    if (webview.webview) {
      webview.webview.webview.html = content;
      webview.webview.reveal();
      return webview;
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
      const settings = await state.settings.getSettings();
      switch (message.command) {
        case "loginWithGitHub":
          new GitHubOAuthService(54321).startServer();
          vscode.env.openExternal(
            vscode.Uri.parse(
              `https://${
                new URL(settings.github.endpoint).hostname
              }/login/oauth/authorize?scope=repo%20read:user&client_id=0b56a3589b5582d11832&redirect_uri=http://localhost:54321/callback`
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

  public async openRepositoryCreationPage(
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
      return webview;
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
      repositoryCreationPanel.dispose();
      const settings = await state.settings.getSettings();
      state.settings.setSettings({
        ...settings,
        repo: {
          ...settings.repo,
          url: message
        }
      });
    });
    repositoryCreationPanel.webview.html = content;
    webview.webview = repositoryCreationPanel;
    repositoryCreationPanel.onDidDispose(() => (webview.webview = null));
    return repositoryCreationPanel;
  }

  private generateContent(options: any) {
    const toReplace: object[] = [];
    options.items.forEach(option => {
      if (typeof option.replace === "string") {
        toReplace.push({
          ...option,
          replace: JSON.stringify(options[option.replace])
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
