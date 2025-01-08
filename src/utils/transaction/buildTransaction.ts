import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

export const buildTransferTransaction = (
  sourceWallet: Keypair,
  newWallet: Keypair,
  transferAmount: number,
  jitoTip: number,
  blockhash: string
): Transaction => {
  console.log("Building transfer transaction:", {
    from: sourceWallet.publicKey.toString(),
    to: newWallet.publicKey.toString(),
    amountSOL: transferAmount / LAMPORTS_PER_SOL,
    jitoTipSOL: jitoTip
  });

  const transaction = new Transaction();
  
  // Add transfer instruction with exact amount including rent
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: sourceWallet.publicKey,
      newAccountPubkey: newWallet.publicKey,
      lamports: transferAmount,
      space: 0,
      programId: SystemProgram.programId,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    console.log("Adding Jito tip:", jitoTip, "SOL");
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