import { useState } from "react";
import { cn } from "@/lib/utils";

const counts = [4, 40, 100, 500, 1000];

interface AddressCounterProps {
  onCountChange: (count: number) => void;
}

const AddressCounter = ({ onCountChange }: AddressCounterProps) => {
  const [selectedCount, setSelectedCount] = useState<number>(4);
  const [customCount, setCustomCount] = useState<string>("");

  const handleCountSelect = (count: number) => {
    setSelectedCount(count);
    setCustomCount("");
    onCountChange(count);
  };

  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomCount(value);
    setSelectedCount(0);
    if (value) {
      onCountChange(parseInt(value));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Buy Address Count</label>
      <div className="flex gap-2">
        {counts.map((count) => (
          <button
            key={count}
            onClick={() => handleCountSelect(count)}
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              count === selectedCount
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            {count}
          </button>
        ))}
        <input
          type="number"
          className="w-20 px-3 py-2 rounded-md border"
          placeholder="Custom"
          value={customCount}
          onChange={handleCustomCountChange}
          min="1"
        />
      </div>
    </div>
  );
};

export default AddressCounter;