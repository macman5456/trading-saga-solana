import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { WalletCreationResult } from "./types";
import { RENT_EXEMPTION, TRANSACTION_FEE } from "./constants";
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
    console.log("Rent exemption per wallet:", RENT_EXEMPTION / LAMPORTS_PER_SOL, "SOL");

    // Calculate amounts
    const amountInLamports = amount * LAMPORTS_PER_SOL;
    const jitoTipInLamports = jitoTip * LAMPORTS_PER_SOL;
    const totalPerWallet = amountInLamports + RENT_EXEMPTION + TRANSACTION_FEE;

    console.log("Distribution details per wallet:", {
      requestedAmount: amount,
      rentExemption: RENT_EXEMPTION / LAMPORTS_PER_SOL,
      transactionFee: TRANSACTION_FEE / LAMPORTS_PER_SOL,
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
        
        const destinationKeypair = Keypair.fromSecretKey(bs58.decode(wallets[i].privateKey));
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
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

        // Then transfer the additional amount
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
        if (jitoTip > 0) {
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
              lamports: jitoTipInLamports,
            })
          );
        }

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = sourceWallet.publicKey;
        
        // Sign with both source and destination wallets
        transaction.sign(sourceWallet, destinationKeypair);
        
        const signature = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: false,
          maxRetries: 3,
          preflightCommitment: 'confirmed',
        });

        await connection.confirmTransaction(signature, 'confirmed');
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