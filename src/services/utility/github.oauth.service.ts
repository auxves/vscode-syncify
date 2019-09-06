import axios from "axios";
import express from "express";
import { Server } from "http";
import { URL, URLSearchParams } from "url";
import { localize, LoggerService, Settings, WebviewService } from "~/services";

export class GitHubOAuthService {
  public app: express.Express;
  public server: Server;

  constructor(public port: number) {
    this.app = express();
    this.app.use(express.json(), express.urlencoded({ extended: false }));
  }

  public async startServer() {
    const settings = await Settings.get();
    const host = new URL(settings.github.endpoint);

    this.server = this.app.listen(this.port);
    this.app.get("/callback", async (req, res) => {
      try {
        const token = await this.getToken(req.param("code"), host);

        res.send(`
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
          </head>
          <body>
              <h1>Success! You may now close this tab.</h1>
              <style>
                html, body {
                  background-color: #1a1a1a;
                  color: #c3c3c3;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100%;
                  width: 100%;
                  margin: 0;
                }
              </style>
          </body>
        </html>
        `);

        this.server.close();

        const user = await this.getUser(token, host);

        this.saveCredentials(token, user);

        WebviewService.openRepositoryCreationPage(token, user, host);
      } catch (err) {
        const error = new Error(err);
        LoggerService.logException(error, null, true);
      }
    });
  }

  public async getToken(code: string, host: URL) {
    const params = new URLSearchParams();
    params.append("client_id", "0b56a3589b5582d11832");
    params.append("client_secret", "3ac123310971a75f0a26e979ce0030467fc32682");
    params.append("code", code);

    try {
      const response = await axios.get(
        `https://${host.hostname}/login/oauth/access_token`,
        {
          method: "POST",
          data: params
        }
      );

      return new URLSearchParams(response.data).get("access_token");
    } catch (err) {
      LoggerService.logException(
        err,
        host.hostname === "github.com"
          ? localize("(error) checkConsole")
          : localize("(error) invalidEnterpriseURL"),
        true
      );
    }
  }

  public async saveCredentials(token: string, user: string) {
    const settings = await Settings.get();
    Settings.set({
      ...settings,
      github: {
        ...settings.github,
        token,
        user
      }
    });
  }

  public async getUser(token: string, host: URL) {
    try {
      const response = await axios.get(`https://api.${host.hostname}/user`, {
        method: "GET",
        headers: { Authorization: `token ${token}` }
      });

      return response.data.login;
    } catch (err) {
      LoggerService.logException(
        err,
        host.hostname === "github.com"
          ? localize("(error) checkConsole")
          : localize("(error) invalidEnterpriseURL"),
        true
      );
    }
  }
}
