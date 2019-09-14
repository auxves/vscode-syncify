export interface ISyncMethod {
  sync(): Promise<void>;
  upload(): Promise<void>;
  download(): Promise<void>;
  isConfigured(): Promise<boolean>;
  reset(): Promise<void>;
}
