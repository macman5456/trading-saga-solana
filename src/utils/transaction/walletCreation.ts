import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, Connection, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";

export const createNewWallet = async (
  connection: Connection,
  sourceWallet: Keypair,
  amount: number,
  jitoTip: number
) => {
  const newWallet = Keypair.generate();
  console.log("Creating new wallet:", newWallet.publicKey.toString());
  console.log("Amount to transfer:", amount, "SOL");

  // Get rent exemption amount
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  console.log("Rent exemption amount:", rentExemption / LAMPORTS_PER_SOL, "SOL");

  // Calculate total amount including rent exemption
  const totalAmount = Math.floor(amount * LAMPORTS_PER_SOL) + rentExemption;
  console.log("Total amount to transfer (including rent):", totalAmount / LAMPORTS_PER_SOL, "SOL");

  const { transaction } = await createFundingTransaction(
    connection,
    sourceWallet.publicKey,
    newWallet.publicKey,
    totalAmount,
    jitoTip
  );

  // Simulate transaction before sending
  const simulation = await connection.simulateTransaction(transaction);
  console.log("Transaction simulation result:", simulation.value);

  if (simulation.value.err) {
    throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
  }

  // Sign and send transaction
  transaction.sign(sourceWallet);
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${confirmation.value.err}`);
  }

  return {
    publicKey: newWallet.publicKey.toString(),
    privateKey: bs58.encode(newWallet.secretKey),
  };
};

const createFundingTransaction = async (
  connection: Connection,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number,
  jitoTip: number
) => {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

  const transaction = new Transaction();

  // Add transfer to new wallet including rent exemption
  transaction.add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount,
    })
  );

  // Add Jito tip if specified
  if (jitoTip > 0) {
    console.log("Adding Jito tip:", jitoTip, "SOL");
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
        lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
      })
    );
  }

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return { transaction, blockhash, lastValidBlockHeight };
};