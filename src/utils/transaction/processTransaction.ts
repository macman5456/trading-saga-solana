import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";

export const processTransaction = async (
  connection: Connection,
  sourceWallet: Keypair,
  newWallet: Keypair,
  buyAmount: number,
  jitoTip: number
): Promise<string> => {
  try {
    console.log("\n=== Starting Transaction Process ===");
    console.log("Source wallet:", sourceWallet.publicKey.toString());
    console.log("Destination wallet:", newWallet.publicKey.toString());
    
    // Calculate amounts
    const transferAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    const totalRequired = transferAmountLamports + rentExemption;
    
    console.log("Amount details:");
    console.log("- Transfer amount:", transferAmountLamports / LAMPORTS_PER_SOL, "SOL");
    console.log("- Rent exemption:", rentExemption / LAMPORTS_PER_SOL, "SOL");
    console.log("- Total required:", totalRequired / LAMPORTS_PER_SOL, "SOL");

    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
    
    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Create and send transaction
    const transaction = new Transaction();
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: totalRequired,
      })
    );

    // Add Jito tip if specified
    if (jitoTip > 0) {
      const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: newWallet.publicKey,
          lamports: jitoTipLamports,
        })
      );
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;
    
    console.log("Signing and sending transaction...");
    transaction.sign(sourceWallet);
    
    const rawTransaction = transaction.serialize();
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent! Signature:", signature);
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const confirmation = await connection.confirmTransaction(signature, 'confirmed');
    
    if (confirmation.value.err) {
      console.error("Transaction failed:", confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    // Verify final balance
    const finalBalance = await connection.getBalance(newWallet.publicKey);
    console.log("New wallet final balance:", finalBalance / LAMPORTS_PER_SOL, "SOL");

    return signature;

  } catch (error: any) {
    console.error("Transaction error:", error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};