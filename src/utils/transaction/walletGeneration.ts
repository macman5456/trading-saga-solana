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
  const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
  const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);

  console.log("Distribution amount per wallet:", amount, "SOL");
  console.log("Jito tip per transaction:", jitoTip, "SOL");

  for (let i = 0; i < wallets.length; i++) {
    console.log("\nProcessing wallet", i + 1 + ":", wallets[i].publicKey);
    
    try {
      const destinationKeypair = Keypair.fromSecretKey(
        Buffer.from(wallets[i].privateKey, "base64")
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log("Got blockhash:", blockhash);

      // Create a simple transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: destinationKeypair.publicKey,
          lamports: amountInLamports,
        })
      );

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

      // Simulate before sending
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Simulation result:", simulation.value);

      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction(signature);
      console.log("Transaction confirmed:", signature);

      onProgress(i + 1);
    } catch (error) {
      console.error("Error processing wallet", i + 1 + ":", error);
      throw error;
    }
  }
};