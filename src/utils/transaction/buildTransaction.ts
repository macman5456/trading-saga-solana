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
  
  // Create account instruction
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: sourceWallet.publicKey,
    newAccountPubkey: newWallet.publicKey,
    lamports: transferAmount,
    space: 0,
    programId: SystemProgram.programId,
  });

  transaction.add(createAccountInstruction);

  // Add Jito tip as a separate instruction if specified
  if (jitoTip > 0) {
    console.log("Adding Jito tip:", jitoTip, "SOL");
    const jitoTipInstruction = SystemProgram.transfer({
      fromPubkey: sourceWallet.publicKey,
      toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
      lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
    });
    transaction.add(jitoTipInstruction);
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sourceWallet.publicKey;

  return transaction;
};