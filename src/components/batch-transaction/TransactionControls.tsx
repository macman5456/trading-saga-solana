import React from "react";
import { Button } from "@/components/ui/button";
import AddressCounter from "../AddressCounter";
import { Input } from "@/components/ui/input";

interface TransactionControlsProps {
  addressCount: number;
  buyAmount: string;
  isProcessing: boolean;
  disabled: boolean;
  onAddressCountChange: (count: number) => void;
  onBuyAmountChange: (amount: string) => void;
  onStartTransaction: () => void;
}

const TransactionControls = ({
  addressCount,
  buyAmount,
  isProcessing,
  disabled,
  onAddressCountChange,
  onBuyAmountChange,
  onStartTransaction,
}: TransactionControlsProps) => {
  return (
    <>
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

      <div className="flex flex-col items-center gap-2">
        <Button
          className="bg-primary hover:bg-primary/90 text-white w-40"
          onClick={onStartTransaction}
          disabled={isProcessing || disabled}
        >
          {isProcessing ? "Processing..." : "Start"}
        </Button>
        <p className="text-sm text-muted-foreground">
          The lowest service fee in the market, with each new address buy costing
          only 0.00009 SOL.
        </p>
      </div>
    </>
  );
};

export default TransactionControls;