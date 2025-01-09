import { SystemProgram, PublicKey, Transaction } from "@solana/web3.js";
import { TransactionConfig } from "./types";
import { JITO_TIP_ACCOUNT } from "./constants";

export const addJitoTip = (
  transaction: Transaction,
  { sourceWallet, jitoTip }: TransactionConfig
) => {
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: new PublicKey(JITO_TIP_ACCOUNT),
        lamports: Math.floor(jitoTip * 1000000000), // Convert SOL to lamports
      })
    );
  }
  return transaction;
};