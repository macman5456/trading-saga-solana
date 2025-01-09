import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { processTransaction } from "@/utils/transaction/processTransaction";
import { WalletCreationResult } from "@/utils/transaction/types";
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

      console.log(`Generating ${addressCount} wallets`);
      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          const newWallet = Keypair.generate();
          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: 0,
            tokenBalance: 0,
          });

          setProcessedWallets(i + 1);
          onProcessedCountChange(i + 1);
        } catch (error: any) {
          console.error(`Error generating wallet ${i + 1}:`, error);
          toast({
            title: "Generation Failed",
            description: `Failed to generate wallet ${i + 1}: ${error.message}`,
            variant: "destructive",
          });
        }
      }

      if (generatedWallets.length > 0) {
        onSuccess(generatedWallets);
        toast({
          title: "Success",
          description: `Successfully generated ${generatedWallets.length} wallets`,
        });
      }

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

      // Get rent exemption amount once before the loop
      const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
      console.log("Rent exemption amount:", rentExemption / LAMPORTS_PER_SOL, "SOL");

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`\nProcessing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = Keypair.generate();
          console.log("Generated new wallet:", newWallet.publicKey.toString());

          // Calculate total amount needed including rent exemption and transaction fees
          const transactionFee = 5000; // 0.000005 SOL
          const totalAmount = (buyAmount * LAMPORTS_PER_SOL) + rentExemption + transactionFee;
          
          const sourceBalance = await connection.getBalance(sourceWallet.publicKey);
          if (sourceBalance < totalAmount) {
            throw new Error(`Insufficient balance for wallet ${i + 1}. Required: ${totalAmount / LAMPORTS_PER_SOL} SOL`);
          }

          // Fund new wallet with exact amount needed
          const fundingTx = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: sourceWallet.publicKey,
              toPubkey: newWallet.publicKey,
              lamports: totalAmount,
            })
          );

          if (jitoTip > 0) {
            fundingTx.add(
              SystemProgram.transfer({
                fromPubkey: sourceWallet.publicKey,
                toPubkey: new PublicKey("JitoNbKdVMXKYLo24HJxjkPiXhHBhJQihxe1fwdnRQV"),
                lamports: Math.floor(jitoTip * LAMPORTS_PER_SOL),
              })
            );
          }

          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          fundingTx.recentBlockhash = blockhash;
          fundingTx.feePayer = sourceWallet.publicKey;
          
          fundingTx.sign(sourceWallet);
          
          console.log("Sending funding transaction...");
          const fundingSignature = await connection.sendRawTransaction(fundingTx.serialize());
          await connection.confirmTransaction(fundingSignature);
          
          console.log("SOL transfer completed with signature:", fundingSignature);

          let tokenBalance = 0;
          if (selectedToken && selectedToken !== "SOL") {
            setCurrentStep(2);
            console.log(`Processing token purchase for ${selectedToken}`);
            
            const swapTransaction = await createRaydiumSwapTransaction(
              connection,
              newWallet.publicKey,
              selectedToken,
              buyAmount
            );

            if (swapTransaction) {
              swapTransaction.sign(newWallet);
              const swapSignature = await connection.sendRawTransaction(swapTransaction.serialize());
              await connection.confirmTransaction(swapSignature);
              console.log("Token swap completed with signature:", swapSignature);
              tokenBalance = 1;
            } else {
              console.error("Failed to create swap transaction");
            }
          }

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: bs58.encode(newWallet.secretKey),
            solBalance: buyAmount,
            tokenBalance: tokenBalance,
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
          continue;
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
    }
  };

  return {
    handleStartTransaction,
    handleGenerateWallets,
    isProcessing,
    currentStep,
    processedWallets,
  };
};

export default TransactionProcessor;