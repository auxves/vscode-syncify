import axios from "axios";
import express from "express";
import { URL, URLSearchParams } from "url";
import { localize, Logger, Settings, Webview } from "~/services";

export class OAuth {
  public static async listen(port: number) {
    try {
      const settings = await Settings.get();
      const host = new URL(settings.github.endpoint);

      const app = express().use(
        express.json(),
        express.urlencoded({ extended: false })
      );

      const server = app.listen(port);

      app.get("/callback", async (req, res) => {
        try {
          const token = await OAuth.getToken(req.param("code"), host);
          const user = await OAuth.getUser(token, host);

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

          server.close();

          OAuth.saveCredentials(token, user);

          Webview.openRepositoryCreationPage(token, user, host);
        } catch (err) {
          Logger.error(err, null, true);
          return;
        }
      });
    } catch (err) {
      Logger.error(err, null, true);
      return;
    }
  }

  private static async getUser(token: string, host: URL) {
    try {
      const response = await axios.get(`https://api.${host.hostname}/user`, {
        method: "GET",
        headers: { Authorization: `token ${token}` }
      });

      return response.data.login;
    } catch (err) {
      Logger.error(
        err,
        host.hostname === "github.com"
          ? null
          : localize("(error) invalidEnterpriseURL"),
        true
      );
    }
  }

  private static async saveCredentials(token: string, user: string) {
    Settings.set({
      github: {
        token,
        user
      }
    });
  }

  private static async getToken(code: string, host: URL) {
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
      Logger.error(
        err,
        host.hostname === "github.com"
          ? null
          : localize("(error) invalidEnterpriseURL"),
        true
      );
    }
  }
}
