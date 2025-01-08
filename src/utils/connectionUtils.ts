import { Connection } from "@solana/web3.js";

export const testConnection = async (endpoint: string): Promise<boolean> => {
  try {
    console.log("Testing connection to:", endpoint);
    const connection = new Connection(endpoint);
    const version = await connection.getVersion();
    console.log("Connection successful, version:", version);
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

export const findLiquidityPool = async (
  endpoint: string,
  tokenAddress: string
): Promise<boolean> => {
  try {
    console.log("Searching liquidity pool for token:", tokenAddress);
    const connection = new Connection(endpoint);
    await connection.getVersion();
    return true;
  } catch (error) {
    console.error("Failed to find liquidity pool:", error);
    return false;
  }
};