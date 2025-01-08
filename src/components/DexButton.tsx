import { cn } from "@/lib/utils";
import { findRaydiumPool, createRaydiumSwapTransaction } from "@/utils/dex/raydiumUtils";
import { useConnection } from "@solana/wallet-adapter-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleClick = async () => {
    if (id === "raydium") {
      try {
        console.log("Initializing Raydium DEX");
        toast({
          title: "Initializing Raydium",
          description: "Setting up Raydium DEX connection...",
        });
      } catch (error: any) {
        console.error("Raydium initialization error:", error);
        toast({
          title: "Initialization Failed",
          description: error.message || "Failed to initialize Raydium",
          variant: "destructive",
        });
      }
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
        isSelected
          ? "bg-primary text-white"
          : "bg-secondary hover:bg-secondary/80",
        isConnecting && "opacity-50 cursor-wait"
      )}
    >
      <span>{icon}</span>
      <span>{name}</span>
    </button>
  );
};

export default DexButton;