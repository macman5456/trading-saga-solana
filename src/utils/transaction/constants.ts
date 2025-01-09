import { LAMPORTS_PER_SOL } from "@solana/web3.js";

// Minimum rent exemption amount required by Solana (0.00204928 SOL)
export const RENT_EXEMPTION = 0.00204928 * LAMPORTS_PER_SOL;

// Standard transaction fee (0.000005 SOL)
export const TRANSACTION_FEE = 0.000005 * LAMPORTS_PER_SOL;

// Maximum retries for transaction
export const MAX_RETRIES = 3;

// Delay between retries (in milliseconds)
export const RETRY_DELAY = 1000;