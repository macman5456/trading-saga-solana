import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { WalletCreationResult } from "./types";
import bs58 from "bs58";

export const generateWallets = async (
  count: number,
  onSuccess: (wallets: WalletCreationResult[]) => void,
  onProcessedCountChange: (count: number) => void,
) => {
  console.log(`Generating ${count} wallets`);
  const generatedWallets: WalletCreationResult[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const newWallet = Keypair.generate();
      generatedWallets.push({
        publicKey: newWallet.publicKey.toString(),
        privateKey: bs58.encode(newWallet.secretKey),
        solBalance: 0,
        tokenBalance: 0,
      });

      onProcessedCountChange(i + 1);
    } catch (error: any) {
      console.error(`Error generating wallet ${i + 1}:`, error);
      throw error;
    }
  }

  onSuccess(generatedWallets);
  return generatedWallets;
};

export const distributeSOL = async (
  connection: Connection,
  sourceWallet: Keypair,
  wallets: WalletCreationResult[],
  amount: number,
  jitoTip: number,
  setProcessedWallets: (count: number) => void
) => {
  try {
    // Get rent exemption amount
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption per wallet:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // Calculate amounts
    const amountInLamports = amount * LAMPORTS_PER_SOL;
    const jitoTipInLamports = jitoTip * LAMPORTS_PER_SOL;
    const transactionFee = 5000; // 0.000005 SOL per transaction
    const totalPerWallet = amountInLamports + rentExemption + transactionFee;

    console.log("Distribution details per wallet:", {
      requestedAmount: amount,
      rentExemption: rentExemption / LAMPORTS_PER_SOL,
      transactionFee: transactionFee / LAMPORTS_PER_SOL,
      total: totalPerWallet / LAMPORTS_PER_SOL,
    });

    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    const totalRequired = (totalPerWallet * wallets.length) + (jitoTipInLamports * wallets.length);

    console.log("Total requirements:", {
      sourceBalance: sourceBalance / LAMPORTS_PER_SOL,
      totalRequired: totalRequired / LAMPORTS_PER_SOL,
      walletCount: wallets.length,
    });

    if (sourceBalance < totalRequired) {
      throw new Error(
        `Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, ` +
        `Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`
      );
    }

    for (let i = 0; i < wallets.length; i++) {
      try {
        console.log(`\nProcessing wallet ${i + 1}:`, wallets[i].publicKey);
        
        // Create destination wallet keypair from private key
        const destinationKeypair = Keypair.fromSecretKey(bs58.decode(wallets[i].privateKey));
        
        // Get a fresh blockhash for each transaction
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        console.log("Got fresh blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);
        
        // Create transaction
        const transaction = new Transaction();

        // Add transfer instruction with the total amount (including rent)
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: destinationKeypair.publicKey,
            lamports: totalPerWallet,
          })
        );

        // Add Jito tip if specified
        if (jitoTip > 0) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
              lamports: jitoTipInLamports,
            })
          );
        }

        // Set the blockhash and fee payer
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sourceWallet.publicKey;
        
        // Sign transaction
        transaction.sign(sourceWallet);
        
        // Simulate transaction before sending
        const simulation = await connection.simulateTransaction(transaction);
        console.log("Simulation result:", simulation.value);

        if (simulation.value.err) {
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        
        console.log("Sending transaction...");
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: 'confirmed',
        });

        console.log("Waiting for confirmation...");
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log("Transaction confirmed successfully");
        setProcessedWallets(i + 1);

        // Add delay between transactions
        if (i < wallets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error: any) {
        console.error(`Error processing wallet ${i + 1}:`, error);
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Distribution error:", error);
    throw error;
  }
};