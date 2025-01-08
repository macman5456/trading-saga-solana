import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";

// Updated rent exemption calculation (approximately 0.00204928 SOL)
const RENT_EXEMPTION = 2039280;

export const validatePrivateKey = (privateKey: string): Keypair | null => {
  try {
    if (!privateKey) return null;
    const decodedKey = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    console.error("Error validating private key:", error);
    return null;
  }
};

export const checkWalletBalance = async (
  connection: Connection,
  wallet: Keypair
): Promise<number> => {
  try {
    console.log("Checking balance for wallet:", wallet.publicKey.toString());
    
    const balance = await connection.getBalance(
      wallet.publicKey,
      'confirmed'
    );
    
    console.log("Retrieved wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
    return balance;
  } catch (error) {
    console.error("Error checking wallet balance:", error);
    throw new Error("Failed to fetch wallet balance");
  }
};

export const createAndFundWallet = async (
  connection: Connection,
  amount: number,
  jitoTip: number,
  fromWallet: Keypair
): Promise<Keypair> => {
  try {
    // Calculate total required amount including rent exemption
    const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const jitoTipInLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
    const totalRequired = amountInLamports + RENT_EXEMPTION + jitoTipInLamports;

    // Check source wallet balance
    const sourceBalance = await checkWalletBalance(connection, fromWallet);
    console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("Required amount:", totalRequired / LAMPORTS_PER_SOL, "SOL");
    
    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL (including rent), Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    const newWallet = Keypair.generate();
    console.log("Generated new wallet:", newWallet.publicKey.toString());

    // Create transaction to fund new wallet with rent exemption included
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: amountInLamports + RENT_EXEMPTION, // Include rent exemption in transfer
      })
    );

    // Add Jito tip if specified
    if (jitoTip > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
          lamports: jitoTipInLamports,
        })
      );
    }

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;

    transaction.sign(fromWallet);
    console.log("Sending transaction...");
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent:", signature);
    
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: await connection.getBlockHeight(),
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed");
    return newWallet;
  } catch (error) {
    console.error("Error in createAndFundWallet:", error);
    throw error;
  }
};

export const closeWallet = async (
  connection: Connection,
  walletToClose: Keypair,
  destinationWallet: PublicKey
): Promise<string> => {
  try {
    const balance = await checkWalletBalance(connection, walletToClose);
    
    if (balance <= 0) {
      throw new Error("No balance to transfer");
    }

    const transaction = new Transaction();
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletToClose.publicKey;

    // Transfer remaining balance minus the transaction fee
    const minimumRent = await connection.getMinimumBalanceForRentExemption(0);
    const transferAmount = balance - minimumRent;

    if (transferAmount > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletToClose.publicKey,
          toPubkey: destinationWallet,
          lamports: transferAmount,
        })
      );
    }

    transaction.sign(walletToClose);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log("Close wallet transaction sent:", signature);
    
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: await connection.getBlockHeight(),
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error(`Close wallet transaction failed: ${confirmation.value.err}`);
    }

    console.log("Close wallet transaction confirmed");
    return signature;
  } catch (error) {
    console.error("Error closing wallet:", error);
    throw error;
  }
};