import { Keypair } from "@solana/web3.js";

export interface TransactionConfig {
  sourceWallet: Keypair;
  jitoTip: number;
}

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