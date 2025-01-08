import { SystemProgram, PublicKey, Transaction } from "@solana/web3.js";
import { TransactionConfig } from "./types";

export const addJitoTip = (
  transaction: Transaction,
  { sourceWallet, jitoTip }: TransactionConfig
) => {
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: Math.floor(jitoTip * 1000000000), // Convert SOL to lamports
      })
    );
  }
  return transaction;
};