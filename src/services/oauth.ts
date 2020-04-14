import axios from "axios";
import express, { Request } from "express";
import { URLSearchParams } from "url";
import { Environment, Logger, Webview } from "~/services";

type Provider = "github" | "gitlab" | "bitbucket";

export namespace OAuth {
	export async function listen(port: number, provider: Provider) {
		try {
			const app = express().use(
				express.json(),
				express.urlencoded({ extended: false })
			);

			const server = app.listen(port);

			app.get("/implicit", async request => {
				const token = request.params.token;
				const user = await getUser(token, provider);

				if (!user) return;

				Webview.openRepositoryCreationPage({ token, user, provider });
			});

			app.get("/callback", async (request, response) => {
				try {
					const data = await handleRequest(request, provider);

					response.send(`
          <!doctype html>
          <html lang="en">
            <head><meta charset="utf-8"></head>
            <body>
                <h1>Success! You may now close tab.</h1>
                <style>html,body{background-color:#343a40;color:#e9e9e9;display:flex;justify-content:center;align-items:center;height:100%;width:100%;margin:0;}</style>
                <script>location.hash&&fetch(\`http://localhost:37468/implicit?token=\${new URLSearchParams(location.hash.slice(1)).get("access_token")}\`);</script>
            </body>
          </html>
          `);

					server.close();

					if (!data) return;

					const { user, token } = data;

					if (!user || !token) return;

					Webview.openRepositoryCreationPage({ token, user, provider });
				} catch (error) {
					Logger.error(error);
				}
			});
		} catch (error) {
			Logger.error(error);
		}
	}

	async function getUser(token: string, provider: Provider) {
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

			const { data } = await axios(urls[provider], {
				method: "GET",
				headers: { Authorization: authHeader[provider] }
			});

			switch (provider) {
				case "github":
					return data.login as string;
				case "gitlab":
				case "bitbucket":
					return data.username as string;
				default:
					return;
			}
		} catch (error) {
			Logger.error(error);
		}
	}

	async function getToken(code: string) {
		try {
			const { data } = await axios(
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

			return new URLSearchParams(data).get("access_token");
		} catch (error) {
			Logger.error(error);
		}
	}

	async function handleRequest(request: Request, provider: Provider) {
		if (provider !== "github") return;

		const token = await getToken(request.params.code);

		if (!token) return;

		const user = await getUser(token, provider);

		return { token, user };
	}
}
