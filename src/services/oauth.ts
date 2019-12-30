import axios from "axios";
import express, { Request } from "express";
import { URLSearchParams } from "url";
import { Environment, Logger, Webview } from "~/services";

type Provider = "github" | "gitlab" | "bitbucket";

export class OAuth {
  public static async listen(port: number, provider: Provider) {
    try {
      const app = express().use(
        express.json(),
        express.urlencoded({ extended: false })
      );

      const server = app.listen(port);

      app.get("/implicit", async req => {
        const token = req.query.token;
        const user = await this.getUser(token, provider);

        if (!user) return;

        Webview.openRepositoryCreationPage({ token, user, provider });
      });

      app.get("/callback", async (req, res) => {
        try {
          const data = await this.handleRequest(req, provider);

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
                    background-color: #343a40;
                    color: #e9e9e9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 100%;
                    margin: 0;
                  }
                </style>
                <script>
                  if(location.hash) {
                    const params = new URLSearchParams(location.hash.slice(1));
                    fetch(\`http://localhost:37468/implicit?token=\${params.get("access_token")}\`);
                  }
                </script>
            </body>
          </html>
          `);

          server.close();

          if (!data) return;

          const { user, token } = data;

          if (!user || !token) return;

          Webview.openRepositoryCreationPage({ token, user, provider });
        } catch (err) {
          Logger.error(err);
          return;
        }
      });
    } catch (err) {
      Logger.error(err);
      return;
    }
  }

  private static async getUser(token: string, provider: Provider) {
    try {
      const urls = {
        github: `https://api.github.com/user`,
        gitlab: `https://gitlab.com/api/v4/user`,
        bitbucket: `https://api.bitbucket.org/2.0/user`
      };

      const authHeader = {
        github: `token ${token}`,
        gitlab: `Bearer ${token}`,
        bitbucket: `Bearer ${token}`
      };

      const response = await axios.get(urls[provider], {
        method: "GET",
        headers: { Authorization: authHeader[provider] }
      });

      switch (provider) {
        case "github":
          return response.data.login as string;
        case "gitlab":
        case "bitbucket":
          return response.data.username as string;
      }
    } catch (err) {
      Logger.error(err);
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
            client_id: Environment.oauthClientIds.github,
            client_secret: "3ac123310971a75f0a26e979ce0030467fc32682"
          }
        }
      );

      return new URLSearchParams(response.data).get("access_token");
    } catch (err) {
      Logger.error(err);
    }
  }

  private static async handleRequest(req: Request, provider: Provider) {
    if (provider !== "github") return;

    const token = await OAuth.getToken(req.query.code);

    if (!token) return;

    const user = await OAuth.getUser(token, provider);

    return { token, user };
  }
}
