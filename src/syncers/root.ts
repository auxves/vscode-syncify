import { Factory, localize, Logger } from "~/services";
import { ProgressLocation, window } from "vscode";
import { LocalSettings, Syncer } from "~/models";

const progressOptions = { location: ProgressLocation.Window };

export class RootSyncer {
	private syncer!: Syncer;

	init = async (type: LocalSettings["syncer"]) => {
		try {
			this.syncer = Factory.generate(type);
			const configured = await this.syncer.isConfigured();
			if (configured) await this.syncer.init();
		} catch (error) {
			void Logger.error(error);
		}
	};

	download = async () => {
		try {
			const configured = await this.syncer.isConfigured();

			if (!configured) {
				// TODO: prompt user to set up
				return;
			}

			await window.withProgress(progressOptions, async (progress) => {
				progress.report({
					message: localize("(info) Syncer.download -> downloading"),
				});

				await this.syncer.download();
			});

			window.setStatusBarMessage(
				localize("(info) Syncer.download -> downloaded"),
				2000,
			);
		} catch (error) {
			void Logger.error(error);
		}
	};

	upload = async () => {
		try {
			const configured = await this.syncer.isConfigured();

			if (!configured) {
				// TODO: prompt user to set up
				return;
			}

			await window.withProgress(progressOptions, async (progress) => {
				progress.report({
					message: localize("(info) Syncer.upload -> uploading"),
				});

				await this.syncer.upload();
			});

			window.setStatusBarMessage(
				localize("(info) Syncer.upload -> uploaded"),
				2000,
			);
		} catch (error) {
			void Logger.error(error);
		}
	};
}
