import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DexOption {
  id: string;
  name: string;
  icon: string;
}

interface DexSelectorProps {
  selectedToken: string;
}

const dexOptions: DexOption[] = [
  { id: "raydium", name: "Raydium", icon: "🔸" },
  { id: "pump", name: "Pump", icon: "🎯" },
  { id: "moonshot", name: "MoonShot", icon: "🌙" },
];

const DexSelector = ({ selectedToken }: DexSelectorProps) => {
  const { toast } = useToast();

  const handleRaydiumTrade = (dexId: string) => {
    if (dexId === "raydium" && selectedToken) {
      // Construct Raydium swap URL with the selected token
      const raydiumUrl = `https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${selectedToken}`;
      
      // Open Raydium in a new tab
      window.open(raydiumUrl, '_blank');
      
      toast({
        title: "Opening Raydium",
        description: "Redirecting to Raydium swap interface",
      });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">DEX Selection</label>
      <div className="flex gap-2">
        {dexOptions.map((dex) => (
          <button
            key={dex.id}
            onClick={() => handleRaydiumTrade(dex.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              dex.id === "raydium"
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
          onClick={() => handleRaydiumTrade("raydium")}
        >
          Find Liquidity Pool
        </button>
      </div>
    </div>
  );
};

export default DexSelector;