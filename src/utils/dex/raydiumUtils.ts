import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Liquidity, Market } from '@raydium-io/raydium-sdk';

export async function findRaydiumPool(
  connection: Connection,
  tokenMint: string
): Promise<any | null> {
  try {
    console.log("Finding Raydium pool for token:", tokenMint);
    
    // Skip if token is SOL
    if (tokenMint === "SOL") {
      console.log("Skipping pool search for SOL");
      return null;
    }

    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Get all Raydium pools with required config
    const programIds = {
      '4': new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
      '5': new PublicKey("5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h")
    };

    const allPools = await Liquidity.fetchAllPoolKeys(connection, programIds);
    console.log("Total pools found:", allPools.length);
    
    // Find pool containing the token
    const pool = allPools.find(pool => 
      pool.baseMint.equals(tokenMintPubkey) || 
      pool.quoteMint.equals(tokenMintPubkey)
    );
    
    if (pool) {
      console.log("Found matching pool:", pool.id.toString());
      // Get pool info
      const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: pool });
      console.log("Pool info:", poolInfo);
    } else {
      console.log("No matching pool found for token");
    }
    
    return pool;
  } catch (error) {
    console.error("Error finding Raydium pool:", error);
    throw error; // Propagate error for better error handling
  }
}

export async function createRaydiumSwapTransaction(
  connection: Connection,
  walletPubkey: PublicKey,
  tokenMint: string,
  amountIn: number
): Promise<Transaction | null> {
  try {
    console.log("Creating Raydium swap transaction");
    const pool = await findRaydiumPool(connection, tokenMint);
    
    if (!pool) {
      console.error("No pool found for token");
      return null;
    }

    // Create a new transaction
    const transaction = new Transaction();

    // Add swap instruction (placeholder - actual swap logic needs market data)
    const swapInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"),
      data: Buffer.from([])
    });

    transaction.add(swapInstruction);
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPubkey;
    
    return transaction;
  } catch (error) {
    console.error("Error creating Raydium swap transaction:", error);
    return null;
  }
}

export async function getTokenPrice(
  connection: Connection,
  tokenMint: string
): Promise<number | null> {
  try {
    const pool = await findRaydiumPool(connection, tokenMint);
    if (!pool) return null;

    // Get pool info
    const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys: pool });
    
    // Calculate approximate price (this is simplified)
    if (poolInfo.baseReserve && poolInfo.quoteReserve) {
      const baseReserve = Number(poolInfo.baseReserve.toString());
      const quoteReserve = Number(poolInfo.quoteReserve.toString());
      
      if (baseReserve > 0) {
        return quoteReserve / baseReserve;
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting token price:", error);
    return null;
  }
}