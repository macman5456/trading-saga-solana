import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
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

      // Get rent exemption amount with extra buffer for transaction fees
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
      const transactionFeeBuffer = 10000; // 0.00001 SOL buffer for transaction fees
      console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

      // Calculate total required amount including all fees and buffers
      const totalRequired = addressCount * (
        (buyAmount * LAMPORTS_PER_SOL) + 
        rentExemption +
        (jitoTip * LAMPORTS_PER_SOL) +
        transactionFeeBuffer
      );

      const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
      console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");
      console.log("Total required amount:", totalRequired / LAMPORTS_PER_SOL, "SOL");
      
      if (sourceBalance < totalRequired) {
        throw new Error(`Insufficient funds. Required: ${(totalRequired / LAMPORTS_PER_SOL).toFixed(6)} SOL, Available: ${(sourceBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
      }

      setCurrentStep(1);
      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          // Create new wallet
          const newWallet = Keypair.generate();
          console.log("New wallet public key:", newWallet.publicKey.toString());

          // Calculate exact amount to send including rent exemption and buffer
          const transferAmount = (buyAmount * LAMPORTS_PER_SOL) + rentExemption + transactionFeeBuffer;
          console.log("Transfer amount:", transferAmount / LAMPORTS_PER_SOL, "SOL");
          
          // Create transaction
          const transaction = new Transaction();
          
          // Add transfer instruction with exact amount including rent
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: newWallet.publicKey,
              lamports: transferAmount,
            })
          );

          // Add Jito tip if specified
          if (jitoTip > 0) {
            console.log("Adding Jito tip:", jitoTip, "SOL");
            transaction.add(
              SystemProgram.transfer({
                fromPubkey: sourceWallet.publicKey,
                toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
                lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
              })
            );
          }

          // Get latest blockhash
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);
          
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = sourceWallet.publicKey;

          // Simulate transaction before sending
          console.log("Simulating transaction for wallet:", newWallet.publicKey.toString());
          const simulation = await connection.simulateTransaction(transaction);
          
          if (simulation.value.err) {
            console.error("Simulation error:", simulation.value.err);
            throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
          }

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
            lastValidBlockHeight,
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