import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Correct rent exemption amount for Solana (0.00204928 SOL)
export const RENT_EXEMPTION = 0.00204928 * LAMPORTS_PER_SOL;

// Standard transaction fee (0.000005 SOL)
export const TRANSACTION_FEE = 0.000005 * LAMPORTS_PER_SOL;

// Delay between retries (ms)
export const RETRY_DELAY = 1000;
export const MAX_RETRIES = 3;