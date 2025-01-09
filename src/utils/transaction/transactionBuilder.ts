import { Connection, Transaction, SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { RENT_EXEMPTION, TRANSACTION_FEE } from "./constants";

export const buildFundingTransaction = async (
  connection: Connection,
  fromWallet: Keypair,
  toWallet: Keypair,
  amount: number,
  jitoTip: number
): Promise<Transaction> => {
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  
  const transaction = new Transaction();

  // Add the main transfer instruction with rent exemption included
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toWallet.publicKey,
      lamports: amount + RENT_EXEMPTION,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: jitoTip,
      })
    );
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromWallet.publicKey;

  return transaction;
};