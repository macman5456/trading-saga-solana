import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Liquidity } from '@raydium-io/raydium-sdk';

export async function findRaydiumPool(
  connection: Connection,
  tokenMint: string
): Promise<any | null> {
  try {
    console.log("Finding Raydium pool for token:", tokenMint);
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Get all Raydium pools with proper parameters
    const allPools = await Liquidity.fetchAllPoolKeys(connection, {
      ownerInfo: false,
      chainTime: new Date().getTime() / 1000
    });
    
    // Find pool containing the token
    const pool = allPools.find(pool => 
      pool.baseMint.equals(tokenMintPubkey) || 
      pool.quoteMint.equals(tokenMintPubkey)
    );
    
    console.log("Found pool:", pool ? "yes" : "no");
    return pool || null;
  } catch (error) {
    console.error("Error finding Raydium pool:", error);
    return null;
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