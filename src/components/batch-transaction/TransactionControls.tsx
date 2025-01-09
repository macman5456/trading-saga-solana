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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <AddressCounter onCountChange={onAddressCountChange} />
        <div className="space-y-2">
          <label className="text-sm font-medium">Buy Amount(SOL)</label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00001"
              value={buyAmount}
              onChange={(e) => onBuyAmountChange(e.target.value)}
              min="0.00001"
              step="0.00001"
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
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={onDistributeSOL}
            disabled={isProcessing || disabled}
          >
            Send To Wallet
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={onStartTransaction}
            disabled={isProcessing || disabled}
          >
            Start Trading
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          The lowest service fee in the market, with each new address buy costing
          only 0.00009 SOL.
        </p>
      </div>
    </div>
  );
};

export default TransactionControls;