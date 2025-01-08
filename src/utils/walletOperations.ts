import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";

// Minimum balance for rent exemption (approximately 0.00203928 SOL)
const RENT_EXEMPTION = 2039280;

export const validatePrivateKey = (privateKey: string): Keypair | null => {
  try {
    const decodedKey = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    console.error("Error validating private key:", error);
    return null;
  }
};

export const createAndFundWallet = async (
  connection: Connection,
  amount: number,
  jitoTip: number,
  fromWallet: Keypair
): Promise<Keypair> => {
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

  const signature = await connection.sendTransaction(transaction, [fromWallet]);
  await connection.confirmTransaction(signature);
  
  return newWallet;
};

export const closeWallet = async (
  connection: Connection,
  walletToClose: Keypair,
  destinationWallet: PublicKey
): Promise<string> => {
  const balance = await connection.getBalance(walletToClose.publicKey);
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: walletToClose.publicKey,
      toPubkey: destinationWallet,
      lamports: balance,
    })
  );

  const signature = await connection.sendTransaction(transaction, [walletToClose]);
  await connection.confirmTransaction(signature);
  
  return signature;
};