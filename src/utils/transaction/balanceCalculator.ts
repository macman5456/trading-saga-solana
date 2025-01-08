import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const calculateRequiredBalance = async (
  connection: Connection,
  addressCount: number,
  buyAmount: number,
  jitoTip: number
): Promise<{ totalRequired: number; rentExemption: number; transactionFeeBuffer: number }> => {
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption per wallet:", rentExemption / LAMPORTS_PER_SOL, "SOL");
  
  // Standard transaction fee is 5000 lamports
  const transactionFeeBuffer = 5000; // 0.000005 SOL per transaction

  // Calculate total required amount
  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    (jitoTip * LAMPORTS_PER_SOL) +
    transactionFeeBuffer
  );

  console.log("Total required balance calculation:", {
    addressCount,
    buyAmountInLamports: buyAmount * LAMPORTS_PER_SOL,
    jitoTipInLamports: jitoTip * LAMPORTS_PER_SOL,
    transactionFeeBuffer,
    totalRequiredInSOL: totalRequired / LAMPORTS_PER_SOL
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
    availableSOL: balance / LAMPORTS_PER_SOL,
    requiredSOL: requiredAmount / LAMPORTS_PER_SOL,
    differenceSOL: (balance - requiredAmount) / LAMPORTS_PER_SOL
  });
  
  if (balance < requiredAmount) {
    throw new Error(
      `Insufficient funds. Required: ${(requiredAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL, ` +
      `Available: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`
    );
  }
};