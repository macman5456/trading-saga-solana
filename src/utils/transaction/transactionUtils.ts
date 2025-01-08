import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export const buildTransferTransaction = (
  sourceWallet: Keypair,
  destinationPubkey: PublicKey,
  amount: number,
  jitoTip: number,
  blockhash: string
): Transaction => {
  const transaction = new Transaction();
  
  // Add main transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: sourceWallet.publicKey,
      toPubkey: destinationPubkey,
      lamports: amount,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
      })
    );
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sourceWallet.publicKey;

  return transaction;
};