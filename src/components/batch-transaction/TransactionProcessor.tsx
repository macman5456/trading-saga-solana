import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, Transaction, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { calculateRequiredBalance, validateBalance } from "@/utils/transaction/balanceCalculator";
import { buildTransferTransaction } from "@/utils/transaction/buildTransaction";
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
const RETRY_DELAY = 1000; // 1 second

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
    transferAmount: number,
    retryCount = 0
  ): Promise<string> => {
    try {
      console.log(`Processing transaction attempt ${retryCount + 1}`);
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

      const transaction = buildTransferTransaction(
        sourceWallet,
        newWallet,
        transferAmount,
        jitoTip,
        blockhash
      );

      // Sign transaction - fixed the signing process
      transaction.sign([sourceWallet, newWallet]);
      
      const rawTransaction = transaction.serialize();
      
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3,
        preflightCommitment: 'confirmed',
      });

      console.log("Transaction sent:", signature);

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return signature;
    } catch (error: any) {
      console.error(`Transaction attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
        return processTransaction(sourceWallet, newWallet, transferAmount, retryCount + 1);
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
      console.log("Starting transaction process with params:", {
        addressCount,
        buyAmount,
        jitoTip,
        selectedToken
      });
      
      setIsProcessing(true);
      setCurrentStep(0);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      if (!selectedToken) {
        throw new Error("Please select a token first");
      }

      const { totalRequired } = await calculateRequiredBalance(connection, addressCount, buyAmount, jitoTip);
      await validateBalance(connection, sourceWallet.publicKey, totalRequired);

      setCurrentStep(1);
      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = Keypair.generate();
          console.log("New wallet public key:", newWallet.publicKey.toString());

          const transferAmount = buyAmount * LAMPORTS_PER_SOL;
          console.log("Transfer amount:", transferAmount / LAMPORTS_PER_SOL, "SOL");

          await processTransaction(sourceWallet, newWallet, transferAmount);

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: buyAmount,
            tokenBalance: 0,
          });

          setProcessedWallets(i + 1);
          onProcessedCountChange(i + 1);

        } catch (error: any) {
          console.error(`Error processing wallet ${i + 1}:`, error);
          toast({
            title: "Error",
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
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process transaction",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
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