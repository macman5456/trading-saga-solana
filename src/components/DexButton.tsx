import { cn } from "@/lib/utils";
import { findRaydiumPool } from "@/utils/dex/raydiumUtils";
import { useConnection } from "@solana/wallet-adapter-react";

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

  const handleClick = async () => {
    if (id === "raydium") {
      // Additional Raydium-specific initialization could go here
      console.log("Initializing Raydium DEX");
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