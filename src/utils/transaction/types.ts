export interface WalletCreationResult {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

export interface TransactionResult {
  signature: string;
  success: boolean;
  error?: string;
}