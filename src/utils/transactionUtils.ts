import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import { validatePrivateKey, createAndFundWallet, closeWallet } from "./walletOperations";
import { findLiquidityPool } from "./connectionUtils";

export const RENT_EXEMPTION = 0.00204928; // ~0.002 SOL
export const TRANSACTION_FEE = 0.000005; // 0.000005 SOL

export const calculateRequiredAmount = (buyAmount: number): number => {
  return buyAmount + RENT_EXEMPTION + TRANSACTION_FEE;
};

export const executeWalletCreation = async (
  connection: Connection,
  buyAmount: number,
  sourceWallet: any,
): Promise<{ publicKey: string; privateKey: string }> => {
  console.log("Creating new wallet with amount:", buyAmount);
  
  const totalAmount = calculateRequiredAmount(buyAmount);
  console.log("Total amount including rent:", totalAmount);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  console.log("Using blockhash:", blockhash);

  const newWallet = await createAndFundWallet(
    connection,
    totalAmount,
    0,
    sourceWallet
  );

  return {
    publicKey: newWallet.publicKey.toString(),
    privateKey: Buffer.from(newWallet.secretKey).toString("base64"),
  };
};

export const executeTokenPurchase = async (
  connection: Connection,
  tokenAddress: string,
): Promise<boolean> => {
  console.log("Executing token purchase for token:", tokenAddress);
  const poolExists = await findLiquidityPool(connection.rpcEndpoint, tokenAddress);
  return poolExists;
};