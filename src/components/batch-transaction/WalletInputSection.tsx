import React from "react";
import PrivateKeyInput from "../form/PrivateKeyInput";
import AddressDisplay from "../form/AddressDisplay";
import BalanceDisplay from "../form/BalanceDisplay";
import WalletBalance from "../WalletBalance";

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
  isLoadingBalance,
  balanceError,
  onPrivateKeyChange,
}: WalletInputSectionProps) => {
  const handleBalanceUpdate = (solBalance: number, tokenBalance: number) => {
    console.log("Balance updated:", { solBalance, tokenBalance });
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <PrivateKeyInput value={privateKey} onChange={onPrivateKeyChange} />
      <AddressDisplay value={publicKey} />
      <WalletBalance 
        publicKey={publicKey} 
        onBalanceUpdate={handleBalanceUpdate}
      />
    </div>
  );
};

export default WalletInputSection;