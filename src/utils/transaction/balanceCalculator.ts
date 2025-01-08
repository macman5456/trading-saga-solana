import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const calculateRequiredBalance = async (
  connection: Connection,
  addressCount: number,
  buyAmount: number,
  jitoTip: number
): Promise<{ totalRequired: number; rentExemption: number; transactionFeeBuffer: number }> => {
  // Get the minimum rent exemption for a new account
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption per wallet:", rentExemption / LAMPORTS_PER_SOL, "SOL");
  
  // Increase transaction fee buffer to ensure sufficient funds
  const transactionFeeBuffer = 15000; // 0.000015 SOL per transaction

  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    rentExemption +
    (jitoTip * LAMPORTS_PER_SOL) +
    transactionFeeBuffer
  );

  console.log("Total required balance calculation:", {
    addressCount,
    buyAmountInLamports: buyAmount * LAMPORTS_PER_SOL,
    rentExemption,
    jitoTipInLamports: jitoTip * LAMPORTS_PER_SOL,
    transactionFeeBuffer,
    totalRequired: totalRequired / LAMPORTS_PER_SOL
  });

  return { totalRequired, rentExemption, transactionFeeBuffer };
};

export const validateBalance = async (
  connection: Connection,
  publicKey: PublicKey,
  requiredAmount: number
): Promise<void> => {
  const balance = await connection.getBalance(publicKey);
  console.log("Balance check:", {
    available: balance / LAMPORTS_PER_SOL,
    required: requiredAmount / LAMPORTS_PER_SOL,
    difference: (balance - requiredAmount) / LAMPORTS_PER_SOL
  });
  
  if (balance < requiredAmount) {
    throw new Error(
      `Insufficient funds. Required: ${(requiredAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL, ` +
      `Available: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
    );
  }
};