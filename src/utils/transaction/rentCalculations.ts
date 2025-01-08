import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";

export const calculateTransferAmount = async (
  connection: Connection,
  buyAmount: number,
  jitoTip: number
): Promise<{ transferAmount: number, totalRequired: number }> => {
  // Get minimum rent exemption for the new account
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  // Calculate transfer amount including rent exemption
  const transferAmount = Math.floor(buyAmount * LAMPORTS_PER_SOL) + rentExemption;
  const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
  const totalRequired = transferAmount + jitoTipLamports + 5000; // Adding 5000 lamports for transaction fee

  console.log("Total amount required:", totalRequired / LAMPORTS_PER_SOL, "SOL");
  
  return { transferAmount, totalRequired };
};