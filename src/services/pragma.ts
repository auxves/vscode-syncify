import { uncomment, comment } from "jsonc-pragma";
import { Environment } from "~/services";

export namespace Pragma {
	export function incoming(content: string, hostname?: string): string {
		return uncomment(content, section => {
			if (section.name !== "sync") return false;

			const checks: boolean[] = [];

			const { host, os, env } = section.args;

			if (host) checks.push(host === hostname);
			if (os) checks.push(os === Environment.os);
			if (env) checks.push(Boolean(process.env[env]));

			return checks.every(Boolean);
		});
	}

	export function outgoing(content: string): string {
		return comment(content, section => section.name === "sync");
	}
}
