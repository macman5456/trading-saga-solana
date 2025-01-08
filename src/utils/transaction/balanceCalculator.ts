import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const calculateRequiredBalance = async (
  connection: Connection,
  addressCount: number,
  buyAmount: number,
  jitoTip: number
): Promise<{ totalRequired: number; rentExemption: number; transactionFeeBuffer: number }> => {
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  const transactionFeeBuffer = 10000; // 0.00001 SOL buffer for transaction fees

  console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    rentExemption +
    (jitoTip * LAMPORTS_PER_SOL) +
    transactionFeeBuffer
  );

  return { totalRequired, rentExemption, transactionFeeBuffer };
};

export const validateBalance = async (
  connection: Connection,
  publicKey: PublicKey,
  requiredAmount: number
): Promise<void> => {
  const balance = await connection.getBalance(publicKey);
  console.log("Source wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");
  console.log("Total required amount:", requiredAmount / LAMPORTS_PER_SOL, "SOL");
  
  if (balance < requiredAmount) {
    throw new Error(
      `Insufficient funds. Required: ${(requiredAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL, ` +
      `Available: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
    );
  }
};