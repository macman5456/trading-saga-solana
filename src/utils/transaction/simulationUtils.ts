import { Transaction, Connection, Keypair } from "@solana/web3.js";

export const simulateTransaction = async (
  transaction: Transaction,
  connection: Connection,
  wallet: Keypair
) => {
  console.log("Simulating transaction for wallet:", wallet.publicKey.toString());
  
  try {
    const simulation = await connection.simulateTransaction(transaction);
    
    if (simulation.value.err) {
      console.error("Simulation error:", simulation.value.err);
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }

    console.log("Simulation successful:", {
      unitsConsumed: simulation.value.unitsConsumed,
      logs: simulation.value.logs
    });

    return true;
  } catch (error: any) {
    console.error("Simulation error:", error);
    throw error;
  }
};