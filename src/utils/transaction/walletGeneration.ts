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

  // Get minimum rent exemption
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption amount:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  // Calculate total amount needed per wallet including rent
  const totalAmountPerWallet = Math.floor(amount * LAMPORTS_PER_SOL) + rentExemption;
  console.log("Total amount per wallet (including rent):", totalAmountPerWallet / LAMPORTS_PER_SOL, "SOL");

  for (let i = 0; i < wallets.length; i++) {
    try {
      console.log(`Processing wallet ${i + 1}/${wallets.length}: ${wallets[i].publicKey}`);
      
      // Create transfer instruction with total amount (including rent)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: new PublicKey(wallets[i].publicKey),
          lamports: totalAmountPerWallet,
        })
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      console.log("Got fresh blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;

      // Sign transaction
      transaction.sign(sourceWallet);

      // Simulate transaction first
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Simulation result:", simulation.value);

      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      // Send transaction
      console.log("Sending transaction...");
      const signature = await connection.sendRawTransaction(
        transaction.serialize(),
        {
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: 'confirmed'
        }
      );

      console.log("Waiting for confirmation...");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("Transaction confirmed successfully:", signature);
      
      // Verify the balance
      const newBalance = await connection.getBalance(new PublicKey(wallets[i].publicKey));
      console.log("New wallet balance:", newBalance / LAMPORTS_PER_SOL, "SOL");

      onProgress(i + 1);

    } catch (error) {
      console.error("Error processing wallet", i + 1, ":", error);
      throw error;
    }
  }
};