export interface Syncer {
  sync(): Promise<void>;
  upload(): Promise<void>;
  download(): Promise<void>;
  isConfigured(): Promise<boolean>;
}
