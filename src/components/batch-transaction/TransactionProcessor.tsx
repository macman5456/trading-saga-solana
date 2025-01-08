import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { executeWalletCreation, executeTokenPurchase } from "@/utils/transactionUtils";
import { useToast } from "@/hooks/use-toast";

interface TransactionProcessorProps {
  privateKey: string;
  addressCount: number;
  buyAmount: number;
  selectedToken: string;
  onSuccess: (wallets: any[]) => void;
  onProcessedCountChange: (count: number) => void;
}

const TransactionProcessor = ({
  privateKey,
  addressCount,
  buyAmount,
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
    try {
      console.log("Starting transaction process...");
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

      setCurrentStep(1);
      const generatedWallets = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = await executeWalletCreation(
            connection,
            buyAmount,
            sourceWallet
          );

          setCurrentStep(2);
          const purchaseSuccess = await executeTokenPurchase(
            connection,
            selectedToken
          );

          if (!purchaseSuccess) {
            throw new Error("Token purchase failed");
          }

          generatedWallets.push({
            ...newWallet,
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