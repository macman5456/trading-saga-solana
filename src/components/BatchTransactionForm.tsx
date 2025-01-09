import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";
import TransactionProcessor from "./batch-transaction/TransactionProcessor";
import { validatePrivateKey } from "@/utils/walletOperations";
import JitoTip from "./JitoTip";

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
  const [buyAmount, setBuyAmount] = useState("0.001"); // Updated minimum amount
  const [jitoTip, setJitoTip] = useState("0.00015");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (privateKey) {
      const keypair = validatePrivateKey(privateKey);
      if (keypair) {
        setPublicKey(keypair.publicKey.toString());
      } else {
        setPublicKey("");
      }
    } else {
      setPublicKey("");
    }
  }, [privateKey]);

  const {
    handleStartTransaction,
    handleGenerateWallets,
    handleDistributeSOL,
    isProcessing,
    currentStep,
    processedWallets,
  } = TransactionProcessor({
    privateKey,
    addressCount,
    buyAmount: parseFloat(buyAmount),
    jitoTip: parseFloat(jitoTip),
    selectedToken,
    onSuccess: onWalletsGenerated,
    onProcessedCountChange: onSuccessCountChange,
  });

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

      <JitoTip onTipChange={setJitoTip} />

      <TransactionControls
        addressCount={addressCount}
        buyAmount={buyAmount}
        isProcessing={isProcessing}
        disabled={!privateKey || isLoadingBalance || !selectedToken}
        onAddressCountChange={setAddressCount}
        onBuyAmountChange={setBuyAmount}
        onStartTransaction={handleStartTransaction}
        onGenerateWallets={handleGenerateWallets}
        onDistributeSOL={handleDistributeSOL}
        currentStep={currentStep}
        processedWallets={processedWallets}
        totalWallets={addressCount}
      />
    </div>
  );
};

export default BatchTransactionForm;