import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { dexOptions } from "@/config/dexOptions";
import { testConnection } from "@/utils/connectionUtils";
import DexButton from "./DexButton";
import { findRaydiumPool } from "@/utils/dex/raydiumUtils";
import { useConnection } from "@solana/wallet-adapter-react";

interface DexSelectorProps {
  selectedToken: string;
  onDexSelect?: (dex: string, endpoint: string) => void;
}

const DexSelector = ({ selectedToken, onDexSelect }: DexSelectorProps) => {
  const { toast } = useToast();
  const [selectedDex, setSelectedDex] = useState<string>("raydium");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { connection } = useConnection();

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

    console.log("Attempting to connect to:", selectedDexOption.name);
    const isConnected = await testConnection(selectedDexOption.rpcEndpoint);

    if (isConnected) {
      setSelectedDex(dexId);
      if (onDexSelect) {
        onDexSelect(dexId, selectedDexOption.rpcEndpoint);
      }
      
      toast({
        title: "DEX Connected",
        description: `Connected to ${selectedDexOption.name} successfully`,
      });
    } else {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${selectedDexOption.name}. Please try again.`,
        variant: "destructive",
      });
    }
    
    setIsConnecting(false);
  };

  const handleFindLiquidityPool = async () => {
    if (!selectedToken) {
      toast({
        title: "Error",
        description: "Please select a token first",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    const selectedDexOption = dexOptions.find(dex => dex.id === selectedDex);
    if (!selectedDexOption) {
      setIsSearching(false);
      return;
    }

    try {
      console.log("Searching for liquidity pool...", {
        dex: selectedDex,
        token: selectedToken
      });
      
      let found = false;
      
      if (selectedDex === "raydium") {
        const pool = await findRaydiumPool(connection, selectedToken);
        found = pool !== null;
        console.log("Raydium pool search result:", { found, pool });
      }
      
      toast({
        title: found ? "Liquidity Pool Found" : "Search Failed",
        description: found 
          ? `Found ${selectedToken} liquidity pool on ${selectedDexOption.name}`
          : `Could not find liquidity pool on ${selectedDexOption.name}`,
        variant: found ? "default" : "destructive",
      });
    } catch (error: any) {
      console.error("Error finding liquidity pool:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to search for liquidity pool",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">DEX Selection</label>
      <div className="flex gap-2">
        {dexOptions.map((dex) => (
          <DexButton
            key={dex.id}
            id={dex.id}
            name={dex.name}
            icon={dex.icon}
            isSelected={selectedDex === dex.id}
            isConnecting={isConnecting}
            onClick={() => handleDexSelection(dex.id)}
          />
        ))}
        <button 
          className={cn(
            "px-4 py-2 rounded-md transition-colors",
            selectedToken 
              ? "bg-primary text-white hover:bg-primary/90" 
              : "bg-secondary text-muted-foreground cursor-not-allowed",
            isSearching && "opacity-50 cursor-wait"
          )}
          disabled={!selectedToken || isConnecting || isSearching}
          onClick={handleFindLiquidityPool}
        >
          {isSearching ? "Searching..." : "Find Liquidity Pool"}
        </button>
      </div>
    </div>
  );
};

export default DexSelector;