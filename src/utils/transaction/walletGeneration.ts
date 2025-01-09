import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
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
  onProgress: (count: number) => void
) => {
  try {
    // Get rent exemption amount
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption amount:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    const transactionFee = 5000; // 0.000005 SOL
    const totalAmountPerWallet = (amount * LAMPORTS_PER_SOL) + rentExemption + transactionFee;
    
    console.log("Distribution details per wallet:");
    console.log("- Amount requested:", amount, "SOL");
    console.log("- Rent exemption:", rentExemption / LAMPORTS_PER_SOL, "SOL");
    console.log("- Transaction fee:", transactionFee / LAMPORTS_PER_SOL, "SOL");
    console.log("- Total per wallet:", totalAmountPerWallet / LAMPORTS_PER_SOL, "SOL");

    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    const totalRequired = totalAmountPerWallet * wallets.length;
    
    console.log("\nTotal requirements:");
    console.log("- Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("- Total required:", totalRequired / LAMPORTS_PER_SOL, "SOL");

    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance in source wallet. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    for (let i = 0; i < wallets.length; i++) {
      try {
        console.log(`\nProcessing wallet ${i + 1}:`, wallets[i].publicKey);
        
        const destinationWallet = new Keypair({
          publicKey: bs58.decode(wallets[i].publicKey),
          secretKey: bs58.decode(wallets[i].privateKey),
        });

        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        console.log("Got blockhash:", blockhash);

        const fundingTx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: destinationWallet.publicKey,
            lamports: totalAmountPerWallet,
          })
        );

        if (jitoTip > 0) {
          fundingTx.add(
            SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: new Keypair().publicKey,
              lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
            })
          );
        }

        fundingTx.recentBlockhash = blockhash;
        fundingTx.feePayer = sourceWallet.publicKey;
        
        fundingTx.sign(sourceWallet);
        
        console.log("Sending transaction...");
        const signature = await connection.sendRawTransaction(fundingTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });

        console.log("Transaction sent, signature:", signature);
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log("Transaction confirmed successfully");
        onProgress(i + 1);
        
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