export interface IVSCodeCommand {
  [name: string]: () => Promise<void>;
}
