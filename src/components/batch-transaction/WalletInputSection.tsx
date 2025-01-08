import React from "react";
import PrivateKeyInput from "../form/PrivateKeyInput";
import AddressDisplay from "../form/AddressDisplay";
import BalanceDisplay from "../form/BalanceDisplay";

interface WalletInputSectionProps {
  privateKey: string;
  publicKey: string;
  solBalance: string;
  tokenBalance: string;
  isLoadingBalance: boolean;
  balanceError?: string | null;
  onPrivateKeyChange: (value: string) => void;
}

const WalletInputSection = ({
  privateKey,
  publicKey,
  solBalance,
  tokenBalance,
  isLoadingBalance,
  balanceError,
  onPrivateKeyChange,
}: WalletInputSectionProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <PrivateKeyInput value={privateKey} onChange={onPrivateKeyChange} />
      <AddressDisplay value={publicKey} />
      <BalanceDisplay
        label="SOL Balance"
        value={solBalance}
        isLoading={isLoadingBalance}
        error={balanceError || undefined}
      />
      <BalanceDisplay
        label="Token Balance"
        value={tokenBalance}
        isLoading={isLoadingBalance}
        error={balanceError || undefined}
      />
    </div>
  );
};

export default WalletInputSection;