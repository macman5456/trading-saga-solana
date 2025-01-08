import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { validateWalletBalance } from "@/utils/transaction/balanceCheck";
import { buildFundingTransaction } from "@/utils/transaction/transactionBuilder";
import { simulateTransaction } from "@/utils/transaction/simulationUtils";
import { TransactionConfig, WalletCreationResult } from "@/utils/transaction/types";

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

      // Validate wallet balance
      await validateWalletBalance(connection, sourceWallet, addressCount, buyAmount, jitoTip);

      setCurrentStep(1);
      const generatedWallets: WalletCreationResult[] = [];

      const config: TransactionConfig = {
        sourceWallet,
        amount: buyAmount,
        jitoTip,
        connection,
      };

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          // Create new wallet
          const newWallet = Keypair.generate();
          console.log("New wallet public key:", newWallet.publicKey.toString());

          // Build and simulate transaction
          const { transaction, blockhash } = await buildFundingTransaction(
            newWallet.publicKey,
            config
          );

          await simulateTransaction(transaction, connection, sourceWallet);

          // Sign and send transaction
          transaction.sign(sourceWallet);
          const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });

          console.log("Transaction sent:", signature);

          // Wait for confirmation
          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight: await connection.getBlockHeight(),
          }, 'confirmed');

          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }

          // Add wallet to generated list
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