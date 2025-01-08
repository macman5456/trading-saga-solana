import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";

// Minimum balance for rent exemption (approximately 0.00203928 SOL)
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
    const balance = await connection.getBalance(wallet.publicKey);
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
  // First check if the source wallet has enough balance
  const sourceBalance = await checkWalletBalance(connection, fromWallet);
  const requiredAmount = (amount * LAMPORTS_PER_SOL) + RENT_EXEMPTION + (jitoTip * LAMPORTS_PER_SOL);
  
  if (sourceBalance < requiredAmount) {
    throw new Error(`Insufficient balance. Required: ${requiredAmount / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
  }

  const newWallet = Keypair.generate();
  const transaction = new Transaction();
  
  // Add transfer for the main amount plus rent exemption
  const totalAmount = (amount * LAMPORTS_PER_SOL) + RENT_EXEMPTION;
  
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: newWallet.publicKey,
      lamports: totalAmount,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: jitoTip * LAMPORTS_PER_SOL,
      })
    );
  }

  try {
    const signature = await connection.sendTransaction(transaction, [fromWallet]);
    console.log("Transaction sent:", signature);
    await connection.confirmTransaction(signature);
    console.log("Transaction confirmed");
    return newWallet;
  } catch (error) {
    console.error("Transaction error:", error);
    throw new Error("Failed to create and fund wallet");
  }
};

export const closeWallet = async (
  connection: Connection,
  walletToClose: Keypair,
  destinationWallet: PublicKey
): Promise<string> => {
  const balance = await checkWalletBalance(connection, walletToClose);
  
  if (balance <= 0) {
    throw new Error("No balance to transfer");
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: walletToClose.publicKey,
      toPubkey: destinationWallet,
      lamports: balance,
    })
  );

  try {
    const signature = await connection.sendTransaction(transaction, [walletToClose]);
    console.log("Close wallet transaction sent:", signature);
    await connection.confirmTransaction(signature);
    console.log("Close wallet transaction confirmed");
    return signature;
  } catch (error) {
    console.error("Error closing wallet:", error);
    throw new Error("Failed to close wallet");
  }
};
