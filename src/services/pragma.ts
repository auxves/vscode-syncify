import { uncomment, comment } from "jsonc-pragma";
import { Environment } from "~/services";

export namespace Pragma {
	export const incoming = (content: string, hostname?: string): string => {
		return uncomment(content, (section) => {
			if (section.name !== "sync") return false;

			const { host, os, env } = section.args;

			const checks: boolean[] = [];

			if (host) checks.push(host === hostname);
			if (os) checks.push(os === Environment.os);
			if (env) checks.push(Boolean(process.env[env]));

			return checks.every(Boolean);
		});
	};

	export const outgoing = (content: string): string => {
		return comment(content, (section) => section.name === "sync");
	};
}
