import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey, createAndFundWallet, closeWallet } from "@/utils/walletOperations";
import { useToast } from "@/hooks/use-toast";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";
import { Keypair, PublicKey } from "@solana/web3.js";
import { findLiquidityPool } from "@/utils/connectionUtils";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

const BatchTransactionForm = ({
  onWalletsGenerated,
  onSuccessCountChange,
  selectedToken,
  selectedDex,
}: {
  onWalletsGenerated: (wallets: WalletInfo[]) => void;
  onSuccessCountChange: (count: number) => void;
  selectedToken: string;
  selectedDex: string;
}) => {
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [solBalance, setSolBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [addressCount, setAddressCount] = useState(1);
  const [buyAmount, setBuyAmount] = useState("0.00001");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
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

      // Validate private key
      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        console.error("Invalid private key provided");
        toast({
          title: "Error",
          description: "Invalid private key provided",
          variant: "destructive",
        });
        return;
      }

      // Validate token selection
      if (!selectedToken) {
        toast({
          title: "Error",
          description: "Please select a token first",
          variant: "destructive",
        });
        return;
      }

      console.log("Source wallet public key:", sourceWallet.publicKey.toString());
      console.log("Selected token:", selectedToken);
      console.log("Selected DEX:", selectedDex);

      // Step 1: Create and fund new wallets
      setCurrentStep(1);
      const generatedWallets: WalletInfo[] = [];
      let successCount = 0;

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Creating wallet ${i + 1} of ${addressCount}`);
          const newWallet = await createAndFundWallet(
            connection,
            parseFloat(buyAmount),
            0, // Jito tip amount
            sourceWallet as Keypair
          );

          console.log(`Successfully created wallet ${i + 1}:`, newWallet.publicKey.toString());

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: Buffer.from(newWallet.secretKey).toString("base64"),
            solBalance: parseFloat(buyAmount),
            tokenBalance: 0,
          });

          // Step 2: Execute token purchase for each wallet
          setCurrentStep(2);
          console.log(`Executing token purchase for wallet ${i + 1}`);
          
          // Check liquidity pool
          const poolExists = await findLiquidityPool(connection.rpcEndpoint, selectedToken);
          if (!poolExists) {
            throw new Error("Liquidity pool not found for selected token");
          }

          // Step 3: Transfer funds back to main wallet
          setCurrentStep(3);
          console.log(`Transferring remaining funds back to main wallet for wallet ${i + 1}`);
          await closeWallet(
            connection,
            newWallet,
            sourceWallet.publicKey
          );

          successCount++;
          setProcessedWallets(i + 1);
        } catch (error: any) {
          console.error(`Error processing wallet ${i + 1}:`, error);
          toast({
            title: "Error",
            description: `Failed to process wallet ${i + 1}: ${error.message}`,
            variant: "destructive",
          });
          break;
        }
      }

      if (successCount > 0) {
        console.log(`Successfully processed ${successCount} wallets`);
        onWalletsGenerated(generatedWallets);
        onSuccessCountChange(successCount);
        toast({
          title: "Success",
          description: `Successfully processed ${successCount} wallets`,
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

  return (
    <div className="space-y-8">
      <BatchTransactionHeader />
      
      <WalletInputSection
        privateKey={privateKey}
        publicKey={publicKey}
        solBalance={solBalance}
        tokenBalance={tokenBalance}
        isLoadingBalance={isLoadingBalance}
        balanceError={balanceError}
        onPrivateKeyChange={setPrivateKey}
      />

      <TransactionControls
        addressCount={addressCount}
        buyAmount={buyAmount}
        isProcessing={isProcessing}
        disabled={!privateKey || isLoadingBalance || !selectedToken}
        onAddressCountChange={setAddressCount}
        onBuyAmountChange={setBuyAmount}
        onStartTransaction={handleStartTransaction}
        currentStep={currentStep}
        processedWallets={processedWallets}
        totalWallets={addressCount}
      />
    </div>
  );
};

export default BatchTransactionForm;