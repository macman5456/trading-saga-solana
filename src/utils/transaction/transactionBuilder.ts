import { SystemProgram, Transaction, Connection, PublicKey } from "@solana/web3.js";
import { TransactionConfig } from "./types";
import { addJitoTip } from "./jitoUtils";

export const buildFundingTransaction = async (
  destinationPubkey: PublicKey,
  config: TransactionConfig
) => {
  const { connection, sourceWallet, amount } = config;

  // Get rent exemption
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption required:", rentExemption / 1000000000, "SOL");

  // Get latest blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed');

  // Create transaction
  let transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sourceWallet.publicKey,
      toPubkey: destinationPubkey,
      lamports: amount * 1000000000 + rentExemption,
    })
  );

  // Add Jito tip if specified
  transaction = addJitoTip(transaction, config);

  // Set transaction properties
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sourceWallet.publicKey;

  return { transaction, blockhash };
};