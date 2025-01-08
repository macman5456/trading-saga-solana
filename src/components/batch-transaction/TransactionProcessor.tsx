import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setProcessedWallets(0);

      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      console.log(`Starting batch process for ${addressCount} wallets`);
      const generatedWallets: WalletCreationResult[] = [];

      // Process wallets in sequence
      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`\nProcessing wallet ${i + 1} of ${addressCount}`);
          
          // Generate new wallet
          const newWallet = Keypair.generate();
          console.log("Generated new wallet:", newWallet.publicKey.toString());

          // Calculate amounts
          const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
          const totalAmount = buyAmount * LAMPORTS_PER_SOL + rentExemption;
          
          // Check source wallet balance
          const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
          if (sourceBalance < totalAmount) {
            throw new Error(`Insufficient balance for wallet ${i + 1}. Required: ${totalAmount / LAMPORTS_PER_SOL} SOL`);
          }

          // Process SOL transfer
          const signature = await processTransaction(
            connection,
            sourceWallet,
            newWallet,
            buyAmount,
            jitoTip
          );
          
          console.log("SOL transfer completed with signature:", signature);

          // Process token purchase if selected
          let tokenBalance = 0;
          if (selectedToken && selectedToken !== "SOL") {
            setCurrentStep(2);
            console.log(`Processing token purchase for ${selectedToken}`);
            // Add token purchase logic here
            // This would involve interacting with the selected DEX and token
            tokenBalance = 0; // Update this when token purchase is implemented
          }

          // Add wallet to results
          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: buyAmount,
            tokenBalance: tokenBalance,
          });

          // Update progress
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
          // Continue with next wallet despite error
          continue;
        }
      }

      // Process successful completion
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