import { window } from "vscode";
import { ISyncService } from "../models/sync.model";

export class FileService implements ISyncService {
  public async sync(): Promise<void> {
    window.showInformationMessage("Syncing!");
  }
  public async upload(): Promise<void> {
    window.showInformationMessage("Uploading!");
  }
  public async download(): Promise<void> {
    window.showInformationMessage("Downloading!");
  }
  public async isConfigured(): Promise<boolean> {
    return true;
  }
  public async reset(): Promise<void> {
    window.showInformationMessage("Resetting!");
  }
}
