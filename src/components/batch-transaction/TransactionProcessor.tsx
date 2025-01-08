import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { calculateTransferAmount } from "@/utils/transaction/rentCalculations";
import { WalletCreationResult } from "@/utils/transaction/types";

interface TransactionProcessorProps {
  privateKey: string;
  addressCount: number;
  buyAmount: number;
  jitoTip: number;
  selectedToken: string;
  onSuccess: (wallets: WalletCreationResult[]) => void;
  onProcessedCountChange: (count: number) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const TransactionProcessor = ({
  privateKey,
  addressCount,
  buyAmount,
  jitoTip,
  selectedToken,
  onSuccess,
  onProcessedCountChange,
}: TransactionProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [processedWallets, setProcessedWallets] = useState(0);
  
  const { connection } = useConnection();
  const { toast } = useToast();

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const processTransaction = async (
    sourceWallet: Keypair,
    newWallet: Keypair,
    retryCount = 0
  ): Promise<string> => {
    try {
      console.log(`Processing transaction attempt ${retryCount + 1} for wallet ${newWallet.publicKey.toString()}`);
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

      // Calculate required amounts including rent
      const { transferAmount, totalRequired } = await calculateTransferAmount(
        connection,
        buyAmount,
        jitoTip
      );

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: newWallet.publicKey,
          lamports: transferAmount,
        })
      );

      if (jitoTip > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: sourceWallet.publicKey,
            toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
            lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
          })
        );
      }

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;
      
      transaction.sign(sourceWallet);
      
      console.log("Sending transaction...");
      const rawTransaction = transaction.serialize();
      
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        maxRetries: 5,
        preflightCommitment: 'finalized',
      });

      console.log("Transaction sent with signature:", signature);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'finalized');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("Transaction confirmed successfully");
      return signature;

    } catch (error: any) {
      console.error(`Transaction attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying transaction in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return processTransaction(sourceWallet, newWallet, retryCount + 1);
      }
      throw error;
    }
  };

  const handleStartTransaction = async () => {
    if (isProcessing) {
      console.log("Transaction already in progress");
      return;
    }

    try {
      console.log("Starting transaction process...");
      setIsProcessing(true);
      setCurrentStep(1);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      console.log("Source wallet validated:", sourceWallet.publicKey.toString());

      if (!selectedToken) {
        throw new Error("Please select a token before starting");
      }

      // Calculate total required amount for all transactions
      const { totalRequired } = await calculateTransferAmount(
        connection,
        buyAmount,
        jitoTip
      );
      
      const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
      console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");

      if (sourceBalance < totalRequired * addressCount) {
        throw new Error(`Insufficient balance. Required: ${(totalRequired * addressCount) / LAMPORTS_PER_SOL} SOL`);
      }

      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = Keypair.generate();
          console.log("Generated new wallet:", newWallet.publicKey.toString());

          const signature = await processTransaction(sourceWallet, newWallet);
          console.log("Transaction successful with signature:", signature);

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: buyAmount,
            tokenBalance: 0,
          });

          setProcessedWallets(i + 1);
          onProcessedCountChange(i + 1);

          if (i < addressCount - 1) {
            await sleep(1000);
          }

        } catch (error: any) {
          console.error(`Error processing wallet ${i + 1}:`, error);
          toast({
            title: "Transaction Failed",
            description: `Failed to process wallet ${i + 1}: ${error.message}`,
            variant: "destructive",
          });
          throw error;
        }
      }

      if (generatedWallets.length > 0) {
        onSuccess(generatedWallets);
        toast({
          title: "Success",
          description: `Successfully processed ${generatedWallets.length} wallets`,
        });
      }
    } catch (error: any) {
      console.error("Transaction process error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
      setProcessedWallets(0);
    }
  };

  return {
    handleStartTransaction,
    isProcessing,
    currentStep,
    processedWallets,
  };
};

export default TransactionProcessor;