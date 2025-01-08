import { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { validatePrivateKey, createAndFundWallet } from "@/utils/walletOperations";
import { useToast } from "@/hooks/use-toast";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";
import { Keypair } from "@solana/web3.js";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

const BatchTransactionForm = ({
  onWalletsGenerated,
  onSuccessCountChange,
}: {
  onWalletsGenerated: (wallets: WalletInfo[]) => void;
  onSuccessCountChange: (count: number) => void;
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

  const { connection } = useConnection();
  const { toast } = useToast();

  const handleStartTransaction = async () => {
    try {
      console.log("Starting transaction process...");
      setIsProcessing(true);

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

      console.log("Source wallet public key:", sourceWallet.publicKey.toString());

      // Create and fund new wallets
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

          successCount++;
        } catch (error: any) {
          console.error(`Error creating wallet ${i + 1}:`, error);
          toast({
            title: "Error",
            description: `Failed to create wallet ${i + 1}: ${error.message}`,
            variant: "destructive",
          });
          break;
        }
      }

      if (successCount > 0) {
        console.log(`Successfully created ${successCount} wallets`);
        onWalletsGenerated(generatedWallets);
        onSuccessCountChange(successCount);
        toast({
          title: "Success",
          description: `Successfully created ${successCount} wallets`,
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
        disabled={!privateKey || isLoadingBalance}
        onAddressCountChange={setAddressCount}
        onBuyAmountChange={setBuyAmount}
        onStartTransaction={handleStartTransaction}
      />
    </div>
  );
};

export default BatchTransactionForm;