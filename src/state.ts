import { ExtensionContext } from "vscode";

interface IState {
	context?: ExtensionContext;
	isDebugMode: boolean;
}

const state: IState = {
	isDebugMode: false
};

export default state;
