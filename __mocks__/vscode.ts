export const window = {
  setStatusBarMessage: () => null,
  withProgress: () => null,
  showInformationMessage: () => null
};

export const extensions = {
  all: [{ id: "arnohovhannisyan.syncify", packageJSON: { isBuiltin: false } }]
};

export enum ProgressLocation {
  Notification = null
}
