import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { 
  Keypair, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  PublicKey 
} from "@solana/web3.js";
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
      console.log("Simulating transaction with details:", {
        sourceWallet: sourceWallet.publicKey.toString(),
        transactionSize: transaction.serialize().length,
      });

      // Get the minimum rent exemption
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
      console.log("Rent exemption required:", rentExemption / LAMPORTS_PER_SOL, "SOL");

      // Add rent exemption to transaction if not already included
      const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
      console.log("Source wallet balance:", sourceBalance / LAMPORTS_PER_SOL, "SOL");

      // Simulate the transaction
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

  const createAndSimulateTransaction = async (
    sourceWallet: Keypair,
    destinationPubkey: PublicKey,
    amount: number,
    rentExemption: number
  ) => {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: destinationPubkey,
        lamports: amount * LAMPORTS_PER_SOL + rentExemption,
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

    return transaction;
  };

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

      // Get rent exemption amount
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
      console.log("Rent exemption per account:", rentExemption / LAMPORTS_PER_SOL, "SOL");

      // Calculate total required amount including rent
      const totalRequired = addressCount * (
        (buyAmount * LAMPORTS_PER_SOL) + 
        rentExemption + 
        (jitoTip * LAMPORTS_PER_SOL) +
        5000 // Additional buffer for transaction fees
      );

      const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
      if (sourceBalance < totalRequired) {
        throw new Error(`Insufficient funds. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
      }

      setCurrentStep(1);
      const generatedWallets = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          // Create new wallet
          const newWallet = Keypair.generate();
          console.log("New wallet public key:", newWallet.publicKey.toString());

          // Create and simulate transaction
          const transaction = await createAndSimulateTransaction(
            sourceWallet,
            newWallet.publicKey,
            buyAmount,
            rentExemption
          );

          // Simulate before sending
          await simulateTransaction(transaction, sourceWallet);

          // Send transaction
          transaction.sign(sourceWallet);
          const signature = await connection.sendRawTransaction(transaction.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });

          console.log("Transaction sent:", signature);

          // Wait for confirmation
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
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