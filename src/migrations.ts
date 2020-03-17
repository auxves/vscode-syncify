import { Migrations } from "~/models";
import { showAnnouncement } from "~/services";

const migrations: Migrations = {
	async "4.0.0"(previousVersion) {
		if (previousVersion === "0.0.0") return;

		const url =
			"https://arnohovhannisyan.space/vscode-syncify/blog/2020/03/15/breaking-changes-in-v4";

		showAnnouncement(url);
	}
};

export default migrations;
