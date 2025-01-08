import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { createNewWallet } from "@/utils/transaction/walletCreation";
import { validateWalletBalance } from "@/utils/transaction/balanceCheck";

interface TransactionProcessorProps {
  privateKey: string;
  addressCount: number;
  buyAmount: number;
  jitoTip: number;
  selectedToken: string;
  onSuccess: (wallets: any[]) => void;
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

  const simulateTransaction = async (transaction: Transaction, sourceWallet: Keypair) => {
    try {
      console.log("Simulating transaction...");
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

  const handleStartTransaction = async () => {
    try {
      console.log("Starting transaction process...");
      console.log("Parameters:", {
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
      console.log("Source wallet public key:", sourceWallet.publicKey.toString());

      if (!selectedToken) {
        throw new Error("Please select a token first");
      }

      // Get latest blockhash before starting transactions
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      console.log("Got fresh blockhash:", blockhash);

      // Validate initial balance
      await validateWalletBalance(connection, sourceWallet, addressCount, buyAmount, jitoTip);

      setCurrentStep(1);
      const generatedWallets = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          // Create transaction for new wallet
          const newWallet = await createNewWallet(
            connection,
            sourceWallet,
            buyAmount,
            jitoTip
          );

          console.log("New wallet created:", newWallet.publicKey);

          // Add wallet to generated list
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