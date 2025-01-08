import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Liquidity, LiquidityPoolKeys, Token } from '@raydium-io/raydium-sdk';
import { Jupiter } from '@jup-ag/core';

export async function findRaydiumPool(
  connection: Connection,
  tokenMint: string
): Promise<LiquidityPoolKeys | null> {
  try {
    console.log("Finding Raydium pool for token:", tokenMint);
    const tokenMintPubkey = new PublicKey(tokenMint);
    
    // Implement actual pool lookup using Raydium SDK
    const pools = await Liquidity.fetchAllPoolKeys(connection);
    const pool = pools.find(pool => 
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

    // Create swap instruction using Raydium SDK
    const swapInstruction = await Liquidity.makeSwapInstruction({
      poolKeys: pool,
      userKeys: {
        tokenAccountIn: walletPubkey,
        tokenAccountOut: walletPubkey,
        owner: walletPubkey
      },
      amountIn,
      amountOut: 0, // Min amount out
      fixedSide: 'in'
    });

    const transaction = new Transaction();
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

    // Fetch pool state and calculate price
    const poolState = await Liquidity.fetchPoolInfo({
      connection,
      poolKeys: pool
    });

    // Calculate price based on pool reserves
    if (poolState.baseReserve && poolState.quoteReserve) {
      const price = poolState.quoteReserve.toNumber() / poolState.baseReserve.toNumber();
      console.log("Calculated token price:", price);
      return price;
    }

    return null;
  } catch (error) {
    console.error("Error getting token price:", error);
    return null;
  }
}

export async function setupJupiterClient(
  connection: Connection
): Promise<Jupiter | null> {
  try {
    const jupiter = await Jupiter.load({
      connection,
      cluster: 'mainnet-beta',
      user: null // Will be set during swap
    });
    
    return jupiter;
  } catch (error) {
    console.error("Error setting up Jupiter client:", error);
    return null;
  }
}

export async function getJupiterPrice(
  jupiter: Jupiter,
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<number | null> {
  try {
    const routes = await jupiter.computeRoutes({
      inputMint: new PublicKey(inputMint),
      outputMint: new PublicKey(outputMint),
      amount,
      slippageBps: 50, // 0.5% slippage
    });

    if (routes.routesInfos.length > 0) {
      const bestRoute = routes.routesInfos[0];
      return bestRoute.outAmount / amount;
    }

    return null;
  } catch (error) {
    console.error("Error getting Jupiter price:", error);
    return null;
  }
}