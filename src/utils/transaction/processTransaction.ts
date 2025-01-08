import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export const processTransaction = async (
  connection: Connection,
  sourceWallet: Keypair,
  newWallet: Keypair,
  buyAmount: number,
  jitoTip: number
): Promise<string> => {
  try {
    console.log("\n=== Starting Transaction Process ===");
    
    // 1. Calculate rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // 2. Calculate total amount needed including rent
    const transferAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    const totalRequired = transferAmountLamports + rentExemption;
    
    console.log("Transfer details:");
    console.log("- Transfer amount:", transferAmountLamports / LAMPORTS_PER_SOL, "SOL");
    console.log("- Total required (with rent):", totalRequired / LAMPORTS_PER_SOL, "SOL");

    // 3. Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
    
    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL (including rent), Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // 4. Create transfer transaction
    const transaction = new Transaction();
    
    // Add transfer instruction with additional amount for rent
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: totalRequired, // This includes both transfer amount and rent exemption
      })
    );

    // 5. Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Got blockhash:", blockhash);
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;
    
    // 6. Sign and send transaction
    transaction.sign(sourceWallet);
    
    console.log("Sending transaction...");
    
    // 7. Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent with signature:", signature);

    // 8. Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error("Transaction error:", confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    // 9. Verify the transfer
    const newBalance = await connection.getBalance(newWallet.publicKey);
    console.log("New wallet balance after transfer:", newBalance / LAMPORTS_PER_SOL, "SOL");

    return signature;

  } catch (error: any) {
    console.error("\n=== Transaction Error ===");
    console.error(error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};