import { window, commands, env, Uri } from "vscode";
import { localize } from "~/services";

export function showAnnouncement(url: string): void {
	const message = window.setStatusBarMessage(
		localize("(info) announcementAvailable"),
	);

	const openBtn = window.createStatusBarItem(1);
	const dismissBtn = window.createStatusBarItem(1);

	const dispose = (): void => {
		openDisposable.dispose();
		dismissDisposable.dispose();
		openBtn.dispose();
		dismissBtn.dispose();
		message.dispose();
	};

	const openDisposable = commands.registerCommand(
		"syncify.openAnnouncement",
		() => {
			dispose();

			return env.openExternal(Uri.parse(url));
		},
	);

	const dismissDisposable = commands.registerCommand(
		"syncify.dismissAnnouncement",
		dispose,
	);

	openBtn.command = "syncify.openAnnouncement";
	openBtn.text = `$(check) ${localize("(label) open")}`;
	openBtn.show();

	dismissBtn.command = "syncify.dismissAnnouncement";
	dismissBtn.text = `$(x) ${localize("(label) dismiss")}`;
	dismissBtn.show();
}
