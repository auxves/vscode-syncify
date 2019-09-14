export interface IVSCodeCommands {
  [name: string]: () => Promise<void>;
}
