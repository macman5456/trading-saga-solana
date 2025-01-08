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
    // First check if the source wallet has enough balance
    const sourceBalance = await checkWalletBalance(connection, fromWallet);
    const requiredAmount = (amount * LAMPORTS_PER_SOL) + RENT_EXEMPTION + (jitoTip * LAMPORTS_PER_SOL);
    
    if (sourceBalance < requiredAmount) {
      throw new Error(`Insufficient balance. Required: ${requiredAmount / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    const newWallet = Keypair.generate();
    console.log("Generated new wallet:", newWallet.publicKey.toString());

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: Math.floor(amount * LAMPORTS_PER_SOL) + RENT_EXEMPTION,
      })
    );

    if (jitoTip > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
          lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
        })
      );
    }

    // Set recent blockhash and sign transaction
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromWallet.publicKey;

    // Sign and send transaction
    transaction.sign(fromWallet);
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent:", signature);
    
    // Wait for confirmation
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
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletToClose.publicKey;

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletToClose.publicKey,
        toPubkey: destinationWallet,
        lamports: balance,
      })
    );

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