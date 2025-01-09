import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletCreationResult } from "./types";
import bs58 from "bs58";

export const generateWallets = async (
  count: number,
  onSuccess: (wallets: WalletCreationResult[]) => void,
  onProcessedCountChange: (count: number) => void,
) => {
  console.log(`Generating ${count} wallets`);
  const generatedWallets: WalletCreationResult[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const newWallet = Keypair.generate();
      generatedWallets.push({
        publicKey: newWallet.publicKey.toString(),
        privateKey: bs58.encode(newWallet.secretKey),
        solBalance: 0,
        tokenBalance: 0,
      });

      onProcessedCountChange(i + 1);
    } catch (error: any) {
      console.error(`Error generating wallet ${i + 1}:`, error);
      throw error;
    }
  }

  onSuccess(generatedWallets);
  return generatedWallets;
};

export const distributeSOL = async (
  connection: Connection,
  sourceWallet: Keypair,
  wallets: WalletCreationResult[],
  amount: number,
  jitoTip: number,
  onProgress: (count: number) => void
) => {
  const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
  const transactionFee = 5000; // 0.000005 SOL
  const totalAmountPerWallet = (amount * LAMPORTS_PER_SOL) + rentExemption + transactionFee;

  for (let i = 0; i < wallets.length; i++) {
    try {
      const destinationWallet = new Keypair({
        publicKey: bs58.decode(wallets[i].publicKey),
        secretKey: bs58.decode(wallets[i].privateKey),
      });

      const fundingTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: destinationWallet.publicKey,
          lamports: totalAmountPerWallet,
        })
      );

      if (jitoTip > 0) {
        fundingTx.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: new Keypair().publicKey,
            lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
          })
        );
      }

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      fundingTx.recentBlockhash = blockhash;
      fundingTx.feePayer = sourceWallet.publicKey;
      
      fundingTx.sign(sourceWallet);
      
      const signature = await connection.sendRawTransaction(fundingTx.serialize());
      await connection.confirmTransaction(signature);

      onProgress(i + 1);
      
      // Add delay between transactions
      if (i < wallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error: any) {
      console.error(`Error distributing SOL to wallet ${i + 1}:`, error);
      throw error;
    }
  }
};