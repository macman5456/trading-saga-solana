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
  console.log("Source wallet:", sourceWallet.publicKey.toString());
  console.log("Amount per wallet:", amount, "SOL");
  
  for (let i = 0; i < wallets.length; i++) {
    try {
      console.log(`Processing wallet ${i + 1}/${wallets.length}: ${wallets[i].publicKey}`);
      
      // Convert amount to lamports
      const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
      
      // Create transfer instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: new PublicKey(wallets[i].publicKey),
          lamports: amountInLamports,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;

      // Sign and send transaction
      transaction.sign(sourceWallet);
      
      console.log("Sending transaction...");
      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        { skipPreflight: true }
      );

      console.log("Waiting for confirmation...");
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("Transaction confirmed successfully:", signature);
      onProgress(i + 1);

    } catch (error) {
      console.error("Error processing wallet", i + 1, ":", error);
      throw error;
    }
  }
};