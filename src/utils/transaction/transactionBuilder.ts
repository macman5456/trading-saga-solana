import { Connection, Transaction, SystemProgram, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const buildFundingTransaction = async (
  connection: Connection,
  fromWallet: Keypair,
  toWallet: Keypair,
  amount: number,
  jitoTip: number
): Promise<Transaction> => {
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  
  const transaction = new Transaction();

  // Add minimum balance (0.001 SOL) to the transfer amount
  const minimumBalance = 0.001 * LAMPORTS_PER_SOL;
  const totalAmount = Math.floor(amount * LAMPORTS_PER_SOL) + minimumBalance;

  // Add the main transfer instruction
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: toWallet.publicKey,
      lamports: totalAmount,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
      })
    );
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromWallet.publicKey;

  return transaction;
};