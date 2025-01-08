import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { processTransaction } from "@/utils/transaction/processTransaction";
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

      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = Keypair.generate();
          console.log("Generated new wallet:", newWallet.publicKey.toString());

          const signature = await processTransaction(
            connection,
            sourceWallet,
            newWallet,
            buyAmount,
            jitoTip
          );
          
          console.log("Transaction successful with signature:", signature);

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: buyAmount,
            tokenBalance: 0,
          });

          setProcessedWallets(i + 1);
          onProcessedCountChange(i + 1);

          // Add delay between transactions
          if (i < addressCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
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