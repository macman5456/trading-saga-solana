import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";

export const processTransaction = async (
  connection: Connection,
  sourceWallet: Keypair,
  newWallet: Keypair,
  buyAmount: number,
  jitoTip: number
): Promise<string> => {
  try {
    console.log("\n=== Starting Simple Transfer Process ===");
    console.log("Source wallet:", sourceWallet.publicKey.toString());
    console.log("Destination wallet:", newWallet.publicKey.toString());
    console.log("Transfer amount:", buyAmount, "SOL");

    // Convert SOL to lamports
    const transferAmountLamports = Math.floor(buyAmount * LAMPORTS_PER_SOL);
    
    // Check source wallet balance
    const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
    console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
    
    if (sourceBalance < transferAmountLamports) {
      throw new Error(`Insufficient balance. Required: ${transferAmountLamports / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
    }

    // Create simple transfer transaction
    const transaction = new Transaction();
    
    // Add transfer instruction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: transferAmountLamports,
      })
    );

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Got blockhash:", blockhash);
    
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;
    
    // Sign transaction
    transaction.sign(sourceWallet);
    
    console.log("Sending transaction...");
    
    // Send transaction
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
    }, 'confirmed');

    if (confirmation.value.err) {
      console.error("Transaction error:", confirmation.value.err);
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed successfully");
    
    // Verify the transfer
    const newBalance = await connection.getBalance(newWallet.publicKey);
    console.log("New wallet balance after transfer:", newBalance / LAMPORTS_PER_SOL, "SOL");

    return signature;

  } catch (error: any) {
    console.error("\n=== Transaction Error ===");
    console.error(error);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};