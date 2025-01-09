import React from "react";
import { Button } from "@/components/ui/button";
import AddressCounter from "../AddressCounter";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface TransactionControlsProps {
  addressCount: number;
  buyAmount: string;
  isProcessing: boolean;
  disabled: boolean;
  onAddressCountChange: (count: number) => void;
  onBuyAmountChange: (amount: string) => void;
  onStartTransaction: () => void;
  onGenerateWallets: () => void;
  onDistributeSOL: () => void;
  currentStep: number;
  processedWallets: number;
  totalWallets: number;
}

const TransactionControls = ({
  addressCount,
  buyAmount,
  isProcessing,
  disabled,
  onAddressCountChange,
  onBuyAmountChange,
  onStartTransaction,
  onGenerateWallets,
  onDistributeSOL,
  currentStep,
  processedWallets,
  totalWallets,
}: TransactionControlsProps) => {
  const getStepMessage = () => {
    switch (currentStep) {
      case 1:
        return "Creating and funding wallets...";
      case 2:
        return "Executing token purchase...";
      case 3:
        return "Transferring funds back...";
      default:
        return "Ready to start";
    }
  };

  const progress = isProcessing ? ((processedWallets / totalWallets) * 100) : 0;

  // Ensure minimum SOL amount for rent exemption
  const handleBuyAmountChange = (value: string) => {
    const minAmount = 0.001; // Minimum amount to cover rent exemption
    const numValue = parseFloat(value);
    if (numValue < minAmount) {
      onBuyAmountChange(minAmount.toString());
    } else {
      onBuyAmountChange(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <AddressCounter onCountChange={onAddressCountChange} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Buy Amount(SOL)</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.001"
              value={buyAmount}
              onChange={(e) => handleBuyAmountChange(e.target.value)}
              min="0.001"
              step="0.001"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              SOL
            </span>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            {getStepMessage()} ({processedWallets}/{totalWallets})
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={onGenerateWallets}
            disabled={isProcessing || disabled}
          >
            Generate Wallets
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Distribution Amount"
              className="w-32"
              value={buyAmount}
              onChange={(e) => handleBuyAmountChange(e.target.value)}
              min="0.001"
              step="0.001"
            />
            <Button
              className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
              onClick={onDistributeSOL}
              disabled={isProcessing || disabled}
            >
              Send To Wallet
            </Button>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={onStartTransaction}
            disabled={isProcessing || disabled}
          >
            Start Trading
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Minimum amount of 0.001 SOL required per wallet to cover rent exemption.
        </p>
      </div>
    </div>
  );
};

export default TransactionControls;