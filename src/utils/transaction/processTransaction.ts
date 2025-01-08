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
    console.log("Source wallet:", sourceWallet.publicKey.toString());
    console.log("New wallet:", newWallet.publicKey.toString());
    console.log("Buy amount:", buyAmount, "SOL");
    console.log("Jito tip:", jitoTip, "SOL");

    // Get source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");

    // Calculate rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // Calculate total amount needed
    const buyAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
    const totalRequired = buyAmountLamports + rentExemption + jitoTipLamports + 5000; // Adding 5000 lamports for fee

    console.log("\n=== Transaction Amounts (in lamports) ===");
    console.log("Buy amount:", buyAmountLamports);
    console.log("Rent exemption:", rentExemption);
    console.log("Jito tip:", jitoTipLamports);
    console.log("Transaction fee:", 5000);
    console.log("Total required:", totalRequired);
    console.log("Available balance:", sourceBalance);

    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("\nGot blockhash:", blockhash);

    // Create transaction
    const transaction = new Transaction();

    // Add transfer instruction with rent exemption
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: buyAmountLamports + rentExemption,
      })
    );

    // Add Jito tip if specified
    if (jitoTip > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
          lamports: jitoTipLamports,
        })
      );
    }

    // Set transaction properties
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;

    // Sign transaction
    console.log("\nSigning transaction...");
    transaction.sign(sourceWallet);

    // Send transaction
    console.log("Sending transaction...");
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent with signature:", signature);

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      console.error("Transaction failed:", confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed successfully");
    return signature;

  } catch (error: any) {
    console.error("\n=== Transaction Error ===");
    console.error(error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};