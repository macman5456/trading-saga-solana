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

    // Calculate the minimum rent exemption needed
    const space = 0; // No data storage needed
    const rentExemption = await connection.getMinimumBalanceForRentExemption(space);
    console.log("Rent exemption:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // Calculate total lamports needed
    const buyAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
    const totalRequired = buyAmountLamports + rentExemption + jitoTipLamports + 5000; // 5000 for fee

    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("\nBalance check:", {
      available: sourceBalance / LAMPORTS_PER_SOL,
      required: totalRequired / LAMPORTS_PER_SOL,
    });

    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Got blockhash:", blockhash);

    // Create transaction
    const transaction = new Transaction();

    // Add create account instruction
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: sourceWallet.publicKey,
        newAccountPubkey: newWallet.publicKey,
        lamports: buyAmountLamports + rentExemption,
        space: space,
        programId: SystemProgram.programId,
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

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;

    // Both wallets must sign
    transaction.sign(sourceWallet, newWallet);

    console.log("Sending transaction...");
    
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent with signature:", signature);

    // Wait for confirmation with more detailed error handling
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error("Transaction error:", confirmation.value.err);
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