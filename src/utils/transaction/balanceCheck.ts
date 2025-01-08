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

  // Get rent exemption amount for a new account
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption per wallet:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  // Calculate total required including rent exemption for each new wallet
  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    rentExemption + 
    (jitoTip * LAMPORTS_PER_SOL) +
    5000 // Additional buffer for transaction fees
  );

  console.log("Transaction requirements:", {
    rentExemptionPerWallet: rentExemption / LAMPORTS_PER_SOL,
    totalRequired: totalRequired / LAMPORTS_PER_SOL,
    availableBalance: balance / LAMPORTS_PER_SOL,
    perWalletCost: ((buyAmount * LAMPORTS_PER_SOL) + rentExemption + (jitoTip * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL,
    addressCount
  });

  if (balance < totalRequired) {
    throw new Error(
      `Insufficient funds. Required: ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL ` +
      `(including ${(rentExemption / LAMPORTS_PER_SOL).toFixed(6)} SOL rent per wallet), ` +
      `Available: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
    );
  }

  return { balance, rentExemption };
};