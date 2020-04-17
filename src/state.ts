import { ExtensionContext } from "vscode";

interface IState {
	context?: ExtensionContext;
}

const state: IState = {};

export default state;
