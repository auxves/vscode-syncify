import { window, commands, env, Uri } from "vscode";
import { localize } from "~/services";

export async function showAnnouncement(url: string): Promise<void> {
	return new Promise(resolve => {
		const message = window.setStatusBarMessage(
			localize("(info) announcementAvailable")
		);

		const openBtn = window.createStatusBarItem(1);
		const dismissBtn = window.createStatusBarItem(1);

		const dispose = () => {
			openDisposable.dispose();
			dismissDisposable.dispose();
			openBtn.dispose();
			dismissBtn.dispose();
			message.dispose();

			resolve();
		};

		const openDisposable = commands.registerCommand(
			"syncify.openAnnouncement",
			() => {
				env.openExternal(Uri.parse(url));

				dispose();
			}
		);

		const dismissDisposable = commands.registerCommand(
			"syncify.dismissAnnouncement",
			dispose
		);

		openBtn.command = "syncify.openAnnouncement";
		openBtn.text = `$(check) ${localize("(label) open")}`;
		openBtn.show();

		dismissBtn.command = "syncify.dismissAnnouncement";
		dismissBtn.text = `$(x) ${localize("(label) dismiss")}`;
		dismissBtn.show();
	});
}
