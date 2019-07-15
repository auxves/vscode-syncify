export interface ISyncService {
  sync(): Promise<void>;
  upload(): Promise<void>;
  download(): Promise<void>;
  isConfigured(): Promise<boolean>;
  reset(): Promise<void>;
}
