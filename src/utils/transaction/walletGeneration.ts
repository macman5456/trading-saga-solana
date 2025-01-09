import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletCreationResult } from "./types";
import { JITO_TIP_ACCOUNT } from "./constants";

const RENT_EXEMPTION = 890880; // ~0.00089088 SOL in lamports

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
  const totalPerWallet = amountInLamports + RENT_EXEMPTION;

  console.log("Rent exemption per wallet:", RENT_EXEMPTION / LAMPORTS_PER_SOL, "SOL");
  console.log("Distribution details per wallet:", {
    amount: amount,
    jitoTip: jitoTip,
    rentExemption: RENT_EXEMPTION / LAMPORTS_PER_SOL,
    total: totalPerWallet / LAMPORTS_PER_SOL,
  });

  const totalRequirements = {
    totalAmount: (totalPerWallet * wallets.length) / LAMPORTS_PER_SOL,
    totalJitoTip: (jitoTipLamports * wallets.length) / LAMPORTS_PER_SOL,
    totalRent: (RENT_EXEMPTION * wallets.length) / LAMPORTS_PER_SOL,
  };

  console.log("Total requirements:", totalRequirements);

  for (let i = 0; i < wallets.length; i++) {
    console.log("\nProcessing wallet", i + 1 + ":", wallets[i].publicKey);
    
    try {
      const destinationKeypair = Keypair.fromSecretKey(
        Buffer.from(wallets[i].privateKey, "base64")
      );

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      console.log("Got fresh blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

      // Create transaction
      const transaction = new Transaction();

      // First create account with minimum rent exemption
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: sourceWallet.publicKey,
          newAccountPubkey: destinationKeypair.publicKey,
          lamports: RENT_EXEMPTION,
          space: 0,
          programId: SystemProgram.programId,
        })
      );

      // Then transfer the additional amount if needed
      if (amountInLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: destinationKeypair.publicKey,
            lamports: amountInLamports,
          })
        );
      }

      // Add Jito tip if specified
      if (jitoTipLamports > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: new PublicKey(JITO_TIP_ACCOUNT),
            lamports: jitoTipLamports,
          })
        );
      }

      // Set transaction parameters
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;

      // Sign with both source and destination wallets
      transaction.sign(sourceWallet, destinationKeypair);

      // Simulate the transaction first
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Simulation result:", simulation);

      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      // Send and confirm transaction
      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      onProgress(i + 1);
    } catch (error) {
      console.error("Error processing wallet", i + 1 + ":", error);
      throw error;
    }
  }
};