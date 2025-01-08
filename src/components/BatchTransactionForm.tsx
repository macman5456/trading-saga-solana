import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";
import TransactionProcessor from "./batch-transaction/TransactionProcessor";

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
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const {
    handleStartTransaction,
    isProcessing,
    currentStep,
    processedWallets,
  } = TransactionProcessor({
    privateKey,
    addressCount,
    buyAmount: parseFloat(buyAmount),
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