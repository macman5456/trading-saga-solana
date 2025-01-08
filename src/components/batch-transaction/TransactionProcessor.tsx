import { useState, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";

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

  const createAndFundWallet = useCallback(async (sourceWallet: Keypair, amount: number) => {
    const newWallet = Keypair.generate();
    console.log("Creating new wallet:", newWallet.publicKey.toString());
    console.log("Amount to transfer:", amount, "SOL");

    // Get the minimum rent exemption amount
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
    console.log("Rent exemption amount:", rentExemption / LAMPORTS_PER_SOL, "SOL");

    // Calculate total amount needed including rent exemption
    const totalAmount = amount * LAMPORTS_PER_SOL + rentExemption;
    console.log("Total amount to transfer (including rent):", totalAmount / LAMPORTS_PER_SOL, "SOL");

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);
    
    const transaction = new Transaction();

    // Add transfer to new wallet (including rent exemption)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: newWallet.publicKey,
        lamports: totalAmount,
      })
    );

    // Add Jito tip if specified
    if (jitoTip > 0) {
      console.log("Adding Jito tip:", jitoTip, "SOL");
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: sourceWallet.publicKey,
          toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
          lamports: jitoTip * LAMPORTS_PER_SOL,
        })
      );
    }

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sourceWallet.publicKey;
    
    try {
      // Calculate required balance for the entire transaction
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Transaction simulation details:", {
        error: simulation.value.err,
        unitsConsumed: simulation.value.unitsConsumed,
        logs: simulation.value.logs
      });

      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      // Sign and send the transaction
      transaction.sign(sourceWallet);
      const signature = await connection.sendRawTransaction(transaction.serialize());
      console.log("Transaction sent with signature:", signature);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      console.log("Transaction confirmed successfully");
      return {
        publicKey: newWallet.publicKey.toString(),
        privateKey: bs58.encode(newWallet.secretKey),
      };
    } catch (error: any) {
      console.error("Detailed transaction error:", error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }, [connection, jitoTip]);

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

      const decodedKey = bs58.decode(privateKey);
      const sourceWallet = Keypair.fromSecretKey(decodedKey);
      console.log("Source wallet public key:", sourceWallet.publicKey.toString());
      
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      if (!selectedToken) {
        throw new Error("Please select a token first");
      }

      // Check source wallet balance
      const balance = await connection.getBalance(sourceWallet.publicKey);
      console.log("Source wallet balance:", balance / LAMPORTS_PER_SOL, "SOL");

      // Calculate total required amount for all transactions
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
      const totalRequired = addressCount * (
        (buyAmount * LAMPORTS_PER_SOL) + 
        rentExemption + 
        (jitoTip * LAMPORTS_PER_SOL)
      );

      console.log("Transaction requirements:", {
        rentExemptionPerWallet: rentExemption / LAMPORTS_PER_SOL,
        totalRequired: totalRequired / LAMPORTS_PER_SOL,
        availableBalance: balance / LAMPORTS_PER_SOL,
        perWalletCost: ((buyAmount * LAMPORTS_PER_SOL) + rentExemption + (jitoTip * LAMPORTS_PER_SOL)) / LAMPORTS_PER_SOL
      });

      if (balance < totalRequired) {
        throw new Error(`Insufficient funds. Required: ${totalRequired / LAMPORTS_PER_SOL} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
      }

      setCurrentStep(1);
      const generatedWallets = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = await createAndFundWallet(sourceWallet, buyAmount);
          console.log("New wallet created:", newWallet.publicKey);

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