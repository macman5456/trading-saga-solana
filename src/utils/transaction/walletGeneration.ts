import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletCreationResult } from "./types";

export const generateWallets = async (
  count: number,
  onSuccess: (wallets: WalletCreationResult[]) => void,
  onProgress: (count: number) => void
): Promise<WalletCreationResult[]> => {
  const wallets: WalletCreationResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const keypair = Keypair.generate();
    wallets.push({
      publicKey: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString("base64"),
      solBalance: 0,
      tokenBalance: 0,
    });
    onProgress(i + 1);
  }
  
  onSuccess(wallets);
  return wallets;
};

export const distributeSOL = async (
  connection: Connection,
  sourceWallet: Keypair,
  wallets: WalletCreationResult[],
  amount: number,
  jitoTip: number = 0,
  onProgress: (count: number) => void
) => {
  console.log("Starting SOL distribution...");
  console.log("Amount per wallet:", amount, "SOL");
  console.log("Jito tip:", jitoTip, "SOL");

  for (let i = 0; i < wallets.length; i++) {
    try {
      console.log(`\nProcessing wallet ${i + 1}/${wallets.length}: ${wallets[i].publicKey}`);
      
      const destinationPubkey = new PublicKey(wallets[i].publicKey);
      const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
      const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);

      // Create a simple transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: destinationPubkey,
        lamports: amountInLamports,
      });

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      // Create and sign transaction
      const transaction = new Transaction()
        .add(transferInstruction);

      // Add Jito tip if specified
      if (jitoTipLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
            lamports: jitoTipLamports,
          })
        );
      }

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;
      
      // Sign transaction
      transaction.sign(sourceWallet);

      console.log("Sending transaction...");
      
      // Send transaction with preflight checks disabled
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true, // Disable preflight checks
        preflightCommitment: 'processed'
      });

      console.log("Transaction sent, signature:", signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("Transaction confirmed successfully");
      onProgress(i + 1);

    } catch (error) {
      console.error("Error processing wallet", i + 1, ":", error);
      throw error;
    }
  }
};