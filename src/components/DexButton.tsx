import { cn } from "@/lib/utils";
import { findRaydiumPool, createRaydiumSwapTransaction } from "@/utils/dex/raydiumUtils";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface DexButtonProps {
  id: string;
  name: string;
  icon: string;
  isSelected: boolean;
  isConnecting: boolean;
  onClick: () => void;
}

const DexButton = ({ id, name, icon, isSelected, isConnecting, onClick }: DexButtonProps) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleClick = async () => {
    if (isInitializing) return;

    setIsInitializing(true);
    if (id === "raydium") {
      try {
        console.log("Initializing Raydium DEX");
        toast({
          title: "Initializing Raydium",
          description: "Setting up Raydium DEX connection...",
        });

        toast({
          title: "DEX Initialized",
          description: "Raydium DEX ready for trading",
        });
      } catch (error: any) {
        console.error("Raydium initialization error:", error);
        toast({
          title: "Initialization Failed",
          description: error.message || "Failed to initialize Raydium",
          variant: "destructive",
        });
      } finally {
        setIsInitializing(false);
      }
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting || isInitializing || !publicKey}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
        isSelected
          ? "bg-primary text-white"
          : "bg-secondary hover:bg-secondary/80",
        (isConnecting || isInitializing) && "opacity-50 cursor-wait",
        !publicKey && "opacity-50 cursor-not-allowed"
      )}
    >
      <span>{icon}</span>
      <span>{name}</span>
      {isInitializing && (
        <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
    </button>
  );
};

export default DexButton;