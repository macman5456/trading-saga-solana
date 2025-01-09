import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import { WalletCreationResult } from "@/utils/transaction/types";
import { generateWallets, distributeSOL } from "@/utils/transaction/walletGeneration";
import { createRaydiumSwapTransaction } from "@/utils/dex/raydiumUtils";

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
  const [generatedWallets, setGeneratedWallets] = useState<WalletCreationResult[]>([]);
  
  const { connection } = useConnection();
  const { toast } = useToast();

  const handleGenerateWallets = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      const wallets = await generateWallets(
        addressCount,
        (wallets) => {
          onSuccess(wallets);
          setGeneratedWallets(wallets);
        },
        onProcessedCountChange
      );

      toast({
        title: "Success",
        description: `Successfully generated ${wallets.length} wallets`,
      });

    } catch (error: any) {
      console.error("Wallet generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate wallets",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const handleDistributeSOL = async () => {
    if (isProcessing || !generatedWallets.length) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      await distributeSOL(
        connection,
        sourceWallet,
        generatedWallets,
        buyAmount,
        jitoTip,
        setProcessedWallets
      );

      toast({
        title: "Success",
        description: `Successfully distributed SOL to ${generatedWallets.length} wallets`,
      });

    } catch (error: any) {
      console.error("SOL distribution error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to distribute SOL",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const handleStartTransaction = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      // First generate and fund wallets
      await handleGenerateWallets();
      await handleDistributeSOL();

      // Then process token swaps if needed
      if (selectedToken && selectedToken !== "SOL") {
        setCurrentStep(2);
        for (const wallet of generatedWallets) {
          const walletKeypair = validatePrivateKey(wallet.privateKey);
          if (!walletKeypair) continue;

          const swapTransaction = await createRaydiumSwapTransaction(
            connection,
            walletKeypair.publicKey,
            selectedToken,
            buyAmount
          );

          if (swapTransaction) {
            swapTransaction.sign(walletKeypair);
            const swapSignature = await connection.sendRawTransaction(swapTransaction.serialize());
            await connection.confirmTransaction(swapSignature);
          }
        }
      }

      toast({
        title: "Success",
        description: `Successfully processed all transactions`,
      });

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
    }
  };

  return {
    handleStartTransaction,
    handleGenerateWallets,
    handleDistributeSOL,
    isProcessing,
    currentStep,
    processedWallets,
  };
};

export default TransactionProcessor;