import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { buildFundingTransaction } from "./transaction/transactionBuilder";

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
  const balance = await connection.getBalance(wallet.publicKey, 'confirmed');
  return balance;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createAndFundWallet = async (
  connection: Connection,
  amount: number,
  jitoTip: number,
  fromWallet: Keypair
): Promise<Keypair> => {
  console.log("Starting wallet creation with amount:", amount, "SOL");
  
  // Convert to lamports and add minimum balance requirement (0.001 SOL)
  const minimumBalance = 0.001 * LAMPORTS_PER_SOL;
  const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
  const jitoTipInLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
  const totalRequired = amountInLamports + minimumBalance + jitoTipInLamports;

  // Check source wallet balance
  const sourceBalance = await checkWalletBalance(connection, fromWallet);
  console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
  
  if (sourceBalance < totalRequired) {
    throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
  }

  const newWallet = Keypair.generate();
  console.log("Created new wallet:", newWallet.publicKey.toString());

  // Create and send transaction
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const transaction = new Transaction();

  // Add transfer instruction with minimum balance included
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: newWallet.publicKey,
      lamports: amountInLamports + minimumBalance,
    })
  );

  // Add Jito tip if specified
  if (jitoTipInLamports > 0) {
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: jitoTipInLamports,
      })
    );
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromWallet.publicKey;

  // Sign transaction
  transaction.sign(fromWallet);
  
  console.log("Sending transaction...");
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  console.log("Transaction sent, signature:", signature);
  
  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    console.error("Transaction failed:", confirmation.value.err);
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }

  console.log("Transaction confirmed successfully");
  return newWallet;
};

export const closeWallet = async (
  connection: Connection,
  walletToClose: Keypair,
  destinationWallet: PublicKey
): Promise<string> => {
  const balance = await checkWalletBalance(connection, walletToClose);
  if (balance <= 0) throw new Error("No balance to transfer");

  const transaction = new Transaction();
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = walletToClose.publicKey;

  // Transfer all balance minus fee
  const transferAmount = balance - 5000; // Leave 5000 lamports for fee
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
  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');
  
  return signature;
};