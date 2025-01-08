import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DexOption {
  id: string;
  name: string;
  icon: string;
}

interface DexSelectorProps {
  selectedToken: string;
  onDexSelect?: (dex: string) => void;
}

const dexOptions: DexOption[] = [
  { id: "raydium", name: "Raydium", icon: "🔸" },
  { id: "pump", name: "Pump", icon: "🎯" },
  { id: "moonshot", name: "MoonShot", icon: "🌙" },
];

const DexSelector = ({ selectedToken, onDexSelect }: DexSelectorProps) => {
  const { toast } = useToast();
  const [selectedDex, setSelectedDex] = useState<string>("raydium");

  const handleDexSelection = (dexId: string) => {
    setSelectedDex(dexId);
    if (onDexSelect) {
      onDexSelect(dexId);
    }
    
    toast({
      title: "DEX Selected",
      description: `Selected ${dexId.charAt(0).toUpperCase() + dexId.slice(1)} as trading DEX`,
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">DEX Selection</label>
      <div className="flex gap-2">
        {dexOptions.map((dex) => (
          <button
            key={dex.id}
            onClick={() => handleDexSelection(dex.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              selectedDex === dex.id
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80"
            )}
          >
            <span>{dex.icon}</span>
            <span>{dex.name}</span>
          </button>
        ))}
        <button 
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            selectedToken 
              ? "bg-primary text-white hover:bg-primary/90" 
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
          disabled={!selectedToken}
          onClick={() => {
            if (selectedToken) {
              toast({
                title: "Finding Liquidity Pool",
                description: `Searching for ${selectedToken} liquidity pool on ${selectedDex}`,
              });
            }
          }}
        >
          Find Liquidity Pool
        </button>
      </div>
    </div>
  );
};

export default DexSelector;