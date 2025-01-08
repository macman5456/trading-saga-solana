import { Keypair, Connection, PublicKey } from "@solana/web3.js";

export interface TransactionConfig {
  sourceWallet: Keypair;
  amount: number;
  jitoTip: number;
  connection: Connection;
}

export interface WalletCreationResult {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}