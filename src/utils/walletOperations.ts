import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { RENT_EXEMPTION, TRANSACTION_FEE, MAX_RETRIES, RETRY_DELAY } from "./transaction/constants";
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
  const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);
  const jitoTipInLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
  const totalRequired = amountInLamports + RENT_EXEMPTION + jitoTipInLamports + TRANSACTION_FEE;

  // Check source wallet balance
  const sourceBalance = await checkWalletBalance(connection, fromWallet);
  
  if (sourceBalance < totalRequired) {
    throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
  }

  const newWallet = Keypair.generate();
  
  // Build and send transaction
  const transaction = await buildFundingTransaction(
    connection,
    fromWallet,
    newWallet,
    amountInLamports,
    jitoTipInLamports
  );

  // Simulate transaction
  const simulation = await connection.simulateTransaction(transaction);
  if (simulation.value.err) {
    throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  // Sign and send transaction
  transaction.sign(fromWallet);
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Confirm transaction
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }

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

  const transferAmount = balance - TRANSACTION_FEE;
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