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

    // Calculate amounts in lamports
    const buyAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    const jitoTipLamports = Math.floor(jitoTip * LAMPORTS_PER_SOL);
    const transactionFee = 5000; // Standard fee

    // Get minimum rent exemption for a data size of 0 (just storing SOL)
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // Calculate total amount needed
    const totalRequired = buyAmountLamports + rentExemption + jitoTipLamports + transactionFee;

    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("\nBalance check:", {
      sourceBalance: sourceBalance / LAMPORTS_PER_SOL,
      required: totalRequired / LAMPORTS_PER_SOL,
      buyAmount: buyAmountLamports / LAMPORTS_PER_SOL,
      rentExemption: rentExemption / LAMPORTS_PER_SOL,
      jitoTip: jitoTipLamports / LAMPORTS_PER_SOL,
      transactionFee: transactionFee / LAMPORTS_PER_SOL,
    });

    if (sourceBalance < totalRequired) {
      throw new Error(`Insufficient balance. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Got blockhash:", blockhash);

    // Create transaction
    const transaction = new Transaction();

    // Create and initialize the account with SystemProgram.createAccount
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: sourceWallet.publicKey,
        newAccountPubkey: newWallet.publicKey,
        lamports: buyAmountLamports + rentExemption, // Include both the transfer amount and rent exemption
        space: 0, // No additional data needed
        programId: SystemProgram.programId, // Using System Program as the owner
      })
    );

    // Add Jito tip if specified
    if (jitoTip > 0) {
      console.log("Adding Jito tip:", jitoTip, "SOL");
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

    // Both wallets need to sign: source wallet for spending and new wallet for account creation
    transaction.sign(sourceWallet, newWallet);

    console.log("Sending transaction...");
    
    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: 'confirmed',
    });

    console.log("Transaction sent with signature:", signature);

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
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