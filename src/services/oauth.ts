import axios from "axios";
import express from "express";
import { URLSearchParams } from "url";
import { Logger, Webview } from "~/services";

export class OAuth {
  public static async listen(port: number) {
    try {
      const app = express().use(
        express.json(),
        express.urlencoded({ extended: false })
      );

      const server = app.listen(port);

      app.get("/callback", async (req, res) => {
        try {
          const token = await OAuth.getToken(req.param("code"));

          if (!token) return;

          const user = await OAuth.getUser(token);

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

          Webview.openRepositoryCreationPage({ token, user });
        } catch (err) {
          Logger.error(err, "", true);
          return;
        }
      });
    } catch (err) {
      Logger.error(err, "", true);
      return;
    }
  }

  private static async getUser(token: string) {
    try {
      const response = await axios.get(`https://api.github.com/user`, {
        method: "GET",
        headers: { Authorization: `token ${token}` }
      });

      return response.data.login;
    } catch (err) {
      Logger.error(err, "", true);
    }
  }

  private static async getToken(code: string) {
    try {
      const response = await axios.get(
        `https://github.com/login/oauth/access_token`,
        {
          method: "POST",
          data: {
            code,
            client_id: "0b56a3589b5582d11832",
            client_secret: "3ac123310971a75f0a26e979ce0030467fc32682"
          }
        }
      );

      return new URLSearchParams(response.data).get("access_token");
    } catch (err) {
      Logger.error(err, "", true);
    }
  }
}
