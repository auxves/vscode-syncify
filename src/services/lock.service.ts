import { state } from "../models/state.model";

export class LockService {
  public async lock(): Promise<void> {
    return state.fs.write(state.env.locations.lockfile, "");
  }

  public async unlock(): Promise<void> {
    await state.fs.delete(state.env.locations.lockfile);
    return;
  }

  public async check(): Promise<boolean> {
    return state.fs.exists(state.env.locations.lockfile);
  }
}
