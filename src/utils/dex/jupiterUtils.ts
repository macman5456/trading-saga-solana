import { Jupiter } from '@jup-ag/core';
import { Connection, PublicKey } from '@solana/web3.js';
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
      // Remove userPublicKey as it's not needed for pool discovery
    });

    const inputToken = new PublicKey('So11111111111111111111111111111111111111112'); // SOL
    const outputToken = new PublicKey(tokenMint);

    const routes = await jupiter.computeRoutes({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: JSBI.BigInt(1000000), // 0.001 SOL in lamports
      slippageBps: 100,
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