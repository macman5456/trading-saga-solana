import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const calculateRequiredBalance = async (
  connection: Connection,
  addressCount: number,
  buyAmount: number,
  jitoTip: number
): Promise<{ totalRequired: number; rentExemption: number; transactionFeeBuffer: number }> => {
  // Higher transaction fee buffer to ensure sufficient funds
  const transactionFeeBuffer = 100000; // 0.0001 SOL per transaction
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);

  console.log("Balance calculation parameters:", {
    addressCount,
    buyAmountSOL: buyAmount,
    jitoTipSOL: jitoTip,
    rentExemptionSOL: rentExemption / LAMPORTS_PER_SOL,
    transactionFeeBufferSOL: transactionFeeBuffer / LAMPORTS_PER_SOL
  });

  // Calculate total required amount
  const totalRequired = addressCount * (
    (buyAmount * LAMPORTS_PER_SOL) + 
    (jitoTip * LAMPORTS_PER_SOL) +
    transactionFeeBuffer +
    rentExemption // Include rent exemption for each wallet
  );

  console.log("Total required balance:", {
    totalRequiredSOL: totalRequired / LAMPORTS_PER_SOL,
    breakdownPerWallet: {
      buyAmount: buyAmount,
      jitoTip: jitoTip,
      rentExemption: rentExemption / LAMPORTS_PER_SOL,
      transactionFee: transactionFeeBuffer / LAMPORTS_PER_SOL
    }
  });

  return { totalRequired, rentExemption, transactionFeeBuffer };
};

export const validateBalance = async (
  connection: Connection,
  publicKey: PublicKey,
  requiredAmount: number
): Promise<void> => {
  const balance = await connection.getBalance(publicKey);
  console.log("Balance validation:", {
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