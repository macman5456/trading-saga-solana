import { Connection, Keypair } from "@solana/web3.js";
import { createTransferTransaction } from "./createTransaction";
import { calculateTransferAmount } from "./rentCalculations";

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processTransaction = async (
  connection: Connection,
  sourceWallet: Keypair,
  newWallet: Keypair,
  buyAmount: number,
  jitoTip: number,
  retryCount = 0
): Promise<string> => {
  try {
    console.log(`Processing transaction attempt ${retryCount + 1} for wallet ${newWallet.publicKey.toString()}`);
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

    // Calculate required amounts
    const { transferAmount } = await calculateTransferAmount(
      connection,
      buyAmount,
      jitoTip
    );

    // Create and sign transaction
    const transaction = createTransferTransaction(
      sourceWallet,
      newWallet,
      transferAmount,
      jitoTip,
      blockhash
    );
    
    transaction.sign(sourceWallet);
    
    console.log("Sending transaction...");
    const rawTransaction = transaction.serialize();
    
    const signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: false,
      maxRetries: 5,
      preflightCommitment: 'finalized',
    });

    console.log("Transaction sent with signature:", signature);

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'finalized');

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    console.log("Transaction confirmed successfully");
    return signature;

  } catch (error: any) {
    console.error(`Transaction attempt ${retryCount + 1} failed:`, error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying transaction in ${RETRY_DELAY}ms...`);
      await sleep(RETRY_DELAY);
      return processTransaction(connection, sourceWallet, newWallet, buyAmount, jitoTip, retryCount + 1);
    }
    throw error;
  }
};