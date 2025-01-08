import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Connection } from "@solana/web3.js";

interface DexOption {
  id: string;
  name: string;
  icon: string;
  rpcEndpoint: string;
}

interface DexSelectorProps {
  selectedToken: string;
  onDexSelect?: (dex: string, endpoint: string) => void;
}

const dexOptions: DexOption[] = [
  { 
    id: "raydium", 
    name: "Raydium", 
    icon: "🔸",
    rpcEndpoint: "https://api.mainnet-beta.solana.com" // Raydium uses Solana mainnet
  },
  { 
    id: "pump", 
    name: "Pump", 
    icon: "🎯",
    rpcEndpoint: "https://pump.rpc.fun" // Pump.fun network endpoint
  },
  { 
    id: "moonshot", 
    name: "MoonShot", 
    icon: "🌙",
    rpcEndpoint: "https://moonshot.rpc.network" // Moonshot network endpoint
  },
];

const DexSelector = ({ selectedToken, onDexSelect }: DexSelectorProps) => {
  const { toast } = useToast();
  const [selectedDex, setSelectedDex] = useState<string>("raydium");
  const [isConnecting, setIsConnecting] = useState(false);

  const testConnection = async (endpoint: string): Promise<boolean> => {
    try {
      const connection = new Connection(endpoint, "confirmed");
      await connection.getSlot();
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  };

  const handleDexSelection = async (dexId: string) => {
    setIsConnecting(true);
    const selectedDexOption = dexOptions.find(dex => dex.id === dexId);
    
    if (!selectedDexOption) {
      toast({
        title: "Error",
        description: "Invalid DEX selection",
        variant: "destructive",
      });
      setIsConnecting(false);
      return;
    }

    const isConnected = await testConnection(selectedDexOption.rpcEndpoint);

    if (isConnected) {
      setSelectedDex(dexId);
      if (onDexSelect) {
        onDexSelect(dexId, selectedDexOption.rpcEndpoint);
      }
      
      toast({
        title: "DEX Connected",
        description: `Connected to ${selectedDexOption.name} network successfully`,
      });
    } else {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${selectedDexOption.name} network. Please try again.`,
        variant: "destructive",
      });
    }
    
    setIsConnecting(false);
  };

  const findLiquidityPool = async () => {
    if (!selectedToken) return;

    const selectedDexOption = dexOptions.find(dex => dex.id === selectedDex);
    if (!selectedDexOption) return;

    try {
      const connection = new Connection(selectedDexOption.rpcEndpoint, "confirmed");
      await connection.getSlot(); // Test connection

      toast({
        title: "Finding Liquidity Pool",
        description: `Searching for ${selectedToken} liquidity pool on ${selectedDexOption.name}`,
      });

    } catch (error) {
      toast({
        title: "Network Error",
        description: `Failed to connect to ${selectedDexOption.name} network`,
        variant: "destructive",
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
            onClick={() => handleDexSelection(dex.id)}
            disabled={isConnecting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
              selectedDex === dex.id
                ? "bg-primary text-white"
                : "bg-secondary hover:bg-secondary/80",
              isConnecting && "opacity-50 cursor-wait"
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
          disabled={!selectedToken || isConnecting}
          onClick={findLiquidityPool}
        >
          Find Liquidity Pool
        </button>
      </div>
    </div>
  );
};

export default DexSelector;