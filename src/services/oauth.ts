/* import got from "got";
import express, { Request } from "express";
import { URLSearchParams } from "url";
import { Environment, Logger } from "~/services";

type Provider = "github" | "gitlab" | "bitbucket";

export namespace OAuth {
	export const listen = async (
		port: number,
		provider: Provider,
	): Promise<void> => {
		try {
			const app = express().use(
				express.json(),
				express.urlencoded({ extended: false }),
			);

			const server = app.listen(port);

			app.get("/implicit", async (request) => {
				const token = request.query.token as string;
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
	};

	const getUser = async (
		token: string,
		provider: Provider,
	): Promise<string> => {
		try {
			const urls = {
				github: `https://api.github.com/user`,
				gitlab: `https://gitlab.com/api/v4/user`,
				bitbucket: `https://api.bitbucket.org/2.0/user`,
			};

			const authHeader = {
				github: `token ${token}`,
				gitlab: `Bearer ${token}`,
				bitbucket: `Bearer ${token}`,
			};

			const data = await got(urls[provider], {
				headers: { Authorization: authHeader[provider] },
			}).json<any>();

			switch (provider) {
				case "github":
					return data.login;
				case "gitlab":
				case "bitbucket":
					return data.username;
				default:
					return "";
			}
		} catch (error) {
			Logger.error(error);
			return "";
		}
	};

	const getToken = async (code: string): Promise<string> => {
		try {
			const data = await got
				.post(`https://github.com/login/oauth/access_token`, {
					json: {
						code,
						client_id: Environment.oauthClientIds.github,
						client_secret: "3ac123310971a75f0a26e979ce0030467fc32682",
					},
				})
				.text();

			return new URLSearchParams(data).get("access_token")!;
		} catch (error) {
			Logger.error(error);
			return "";
		}
	};

	const handleRequest = async (
		request: Request,
		provider: Provider,
	): Promise<{ token?: string; user?: string } | undefined> => {
		if (provider !== "github") return;

		const token = await getToken(request.query.code as string);

		if (!token) return;

		const user = await getUser(token, provider);

		return { token, user };
	};
}
 */
