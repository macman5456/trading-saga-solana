import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const calculateTransferAmount = async (
  connection: Connection,
  buyAmount: number,
  jitoTip: number
): Promise<{ transferAmount: number; totalRequired: number }> => {
  console.log("Calculating transfer amounts...");
  
  // Get rent exemption
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  // Calculate amounts
  const transferAmount = Math.floor(buyAmount * LAMPORTS_PER_SOL);
  const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
  const totalRequired = transferAmount + rentExemption + jitoTipLamports + 5000; // Adding 5000 lamports for transaction fee

  console.log("Calculated amounts:");
  console.log("- Transfer amount:", transferAmount / LAMPORTS_PER_SOL, "SOL");
  console.log("- Total required:", totalRequired / LAMPORTS_PER_SOL, "SOL");

  return { transferAmount, totalRequired };
};