import { Factory, localize, Logger } from "~/services";
import { ProgressLocation, window } from "vscode";
import { LocalSettings, Syncer } from "~/models";

export class RootSyncer {
	private syncer!: Syncer;

	init = async (type: LocalSettings["syncer"]) => {
		try {
			this.syncer = Factory.generate(type);
			const configured = await this.syncer.isConfigured();
			if (configured) await this.syncer.init?.();
		} catch (error) {
			Logger.error(error);
		}
	};

	download = async () => {
		try {
			const configured = await this.syncer.isConfigured();

			if (configured) {
				await window.withProgress(
					{ location: ProgressLocation.Window },
					async (progress) => {
						progress.report({
							message: localize("(info) Syncer.download -> downloading"),
						});

						await this.syncer.download();

						progress.report({ increment: 100 });

						await new Promise((r) => setTimeout(r, 10));

						window.setStatusBarMessage(
							localize("(info) Syncer.download -> downloaded"),
							2000,
						);
					},
				);
			}
		} catch (error) {
			Logger.error(error);
		}
	};

	upload = async () => {
		try {
			const configured = await this.syncer.isConfigured();

			if (configured) {
				await window.withProgress(
					{ location: ProgressLocation.Window },
					async (progress) => {
						progress.report({
							message: localize("(info) Syncer.upload -> uploading"),
						});

						await this.syncer.upload();

						progress.report({ increment: 100 });

						await new Promise((r) => setTimeout(r, 10));

						window.setStatusBarMessage(
							localize("(info) Syncer.upload -> uploaded"),
							2000,
						);
					},
				);
			}
		} catch (error) {
			Logger.error(error);
		}
	};
}
