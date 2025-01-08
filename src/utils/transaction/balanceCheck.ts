import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const validateWalletBalance = async (
  connection: Connection,
  sourceWallet: Keypair,
  addressCount: number,
  buyAmount: number,
  jitoTip: number
) => {
  const balance = await connection.getBalance(sourceWallet.publicKey);
  console.log("Source wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");

  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    rentExemption + 
    (jitoTip * LAMPORTS_PER_SOL)
  );

  console.log("Transaction requirements:", {
    rentExemptionPerWallet: rentExemption / LAMPORTS_PER_SOL,
    totalRequired: totalRequired / LAMPORTS_PER_SOL,
    availableBalance: balance / LAMPORTS_PER_SOL,
    perWalletCost: ((buyAmount * LAMPORTS_PER_SOL) + rentExemption + (jitoTip * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL
  });

  if (balance < totalRequired) {
    throw new Error(`Insufficient funds. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
  }

  return { balance, rentExemption };
};