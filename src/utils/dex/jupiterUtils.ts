import { Jupiter } from '@jup-ag/core';
import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import JSBI from 'jsbi';

export async function findJupiterPool(
  connection: Connection,
  tokenMint: string
): Promise<boolean> {
  try {
    console.log("Initializing Jupiter and searching for pools...");
    
    const jupiter = await Jupiter.load({
      connection,
      cluster: 'mainnet-beta',
      platformFeeAndAccounts: {
        feeBps: 50,
        feeAccounts: undefined
      }
    });

    const inputToken = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
    const outputToken = new PublicKey(tokenMint);

    const routes = await jupiter.computeRoutes({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: JSBI.BigInt(1000000), // 0.001 SOL in lamports
      slippageBps: 100,
      forceFetch: true
    });

    console.log("Jupiter routes found:", routes.routesInfos.length);
    
    if (routes.routesInfos.length > 0) {
      console.log("Found liquidity pool through Jupiter");
      return true;
    }
    
    console.log("No routes found for token");
    return false;

  } catch (error) {
    console.error("Error finding Jupiter pools:", error);
    throw error;
  }
}

export async function executeJupiterSwap(
  jupiter: Jupiter,
  inputToken: PublicKey,
  outputToken: PublicKey,
  amount: number,
  slippage: number = 1.0
): Promise<Transaction | VersionedTransaction> {
  try {
    const routes = await jupiter.computeRoutes({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: JSBI.BigInt(amount),
      slippageBps: Math.floor(slippage * 100),
      forceFetch: true
    });

    if (routes.routesInfos.length === 0) {
      throw new Error("No routes found for swap");
    }

    const bestRoute = routes.routesInfos[0];
    const { swapTransaction } = await jupiter.exchange({
      routeInfo: bestRoute
    });

    return swapTransaction;
  } catch (error) {
    console.error("Error executing Jupiter swap:", error);
    throw error;
  }
}