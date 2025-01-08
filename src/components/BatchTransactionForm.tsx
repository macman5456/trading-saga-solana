import { useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey, createAndFundWallet, closeWallet } from "@/utils/walletOperations";
import { useToast } from "@/hooks/use-toast";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
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

  // Add useEffect to fetch balance when private key changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!privateKey) {
        setPublicKey("");
        setSolBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      setBalanceError(null);

      try {
        const wallet = validatePrivateKey(privateKey);
        if (!wallet) {
          setBalanceError("Invalid private key");
          return;
        }

        setPublicKey(wallet.publicKey.toString());
        const balance = await connection.getBalance(wallet.publicKey, 'confirmed');
        setSolBalance((balance / LAMPORTS_PER_SOL).toString());
      } catch (error: any) {
        console.error("Error fetching balance:", error);
        setBalanceError(error.message);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [privateKey, connection]);

  const handleStartTransaction = async () => {
    try {
      console.log("Starting transaction process...");
      setIsProcessing(true);
      setCurrentStep(0);
      setProcessedWallets(0);

      // Validate private key
      const sourceWallet = validatePrivateKey(privateKey);
      if (!sourceWallet) {
        throw new Error("Invalid private key provided");
      }

      // Validate token selection
      if (!selectedToken) {
        throw new Error("Please select a token first");
      }

      console.log("Source wallet public key:", sourceWallet.publicKey.toString());
      console.log("Selected token:", selectedToken);
      console.log("Selected DEX:", selectedDex);

      // Step 1: Create and fund new wallets
      setCurrentStep(1);
      const generatedWallets: WalletInfo[] = [];

      for (let i = 0; i < addressCount; i++) {
        try {
          console.log(`Creating wallet ${i + 1} of ${addressCount}`);
          
          // Get latest blockhash before each transaction
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          console.log(`Using blockhash: ${blockhash} for wallet ${i + 1}`);

          const newWallet = await createAndFundWallet(
            connection,
            parseFloat(buyAmount),
            0,
            sourceWallet
          );

          console.log(`Successfully created wallet ${i + 1}:`, newWallet.publicKey.toString());

          // Step 2: Execute token purchase for each wallet
          setCurrentStep(2);
          console.log(`Executing token purchase for wallet ${i + 1}`);
          
          const poolExists = await findLiquidityPool(connection.rpcEndpoint, selectedToken);
          if (!poolExists) {
            throw new Error("Liquidity pool not found for selected token");
          }

          // Step 3: Transfer funds back to main wallet
          setCurrentStep(3);
          console.log(`Transferring remaining funds back for wallet ${i + 1}`);
          await closeWallet(
            connection,
            newWallet,
            sourceWallet.publicKey
          );

          generatedWallets.push({
            publicKey: newWallet.publicKey.toString(),
            privateKey: Buffer.from(newWallet.secretKey).toString("base64"),
            solBalance: parseFloat(buyAmount),
            tokenBalance: 0,
          });

          setProcessedWallets(i + 1);
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
        console.log(`Successfully processed ${generatedWallets.length} wallets`);
        onWalletsGenerated(generatedWallets);
        onSuccessCountChange(generatedWallets.length);
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