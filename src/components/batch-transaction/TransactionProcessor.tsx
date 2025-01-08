import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey } from "@/utils/walletOperations";
import { Keypair, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";
import { calculateRequiredBalance, validateBalance } from "@/utils/transaction/balanceCalculator";
import { buildTransferTransaction } from "@/utils/transaction/buildTransaction";
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

      // Calculate required balance and validate
      const { totalRequired, rentExemption, transactionFeeBuffer } = 
        await calculateRequiredBalance(connection, addressCount, buyAmount, jitoTip);
      await validateBalance(connection, sourceWallet.publicKey, totalRequired);

      setCurrentStep(1);
      const generatedWallets: WalletCreationResult[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Processing wallet ${i + 1} of ${addressCount}`);
          
          const newWallet = Keypair.generate();
          console.log("New wallet public key:", newWallet.publicKey.toString());

          const transferAmount = (buyAmount * LAMPORTS_PER_SOL) + rentExemption + transactionFeeBuffer;
          console.log("Transfer amount:", transferAmount / LAMPORTS_PER_SOL, "SOL");
          
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          console.log("Got blockhash:", blockhash, "lastValidBlockHeight:", lastValidBlockHeight);

          const transaction = buildTransferTransaction(
            sourceWallet,
            newWallet,
            transferAmount,
            jitoTip,
            blockhash
          );

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

          const confirmation = await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight,
          }, 'confirmed');

          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }

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