import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

interface WalletBalanceProps {
  publicKey: string;
  onBalanceUpdate: (solBalance: number, tokenBalance: number) => void;
}

const WalletBalance = ({ publicKey, onBalanceUpdate }: WalletBalanceProps) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const { toast } = useToast();

  const connection = new Connection(
    "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com",
    "confirmed"
  );

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setSolBalance(0);
        setTokenBalance(0);
        return;
      }

      try {
        const balance = await connection.getBalance(new PublicKey(publicKey));
        const newSolBalance = balance / LAMPORTS_PER_SOL;
        setSolBalance(newSolBalance);
        onBalanceUpdate(newSolBalance, 0); // Update parent component
        console.log("Updated SOL balance:", newSolBalance);
      } catch (error) {
        console.error("Error fetching balance:", error);
        if (error instanceof Error) {
          toast({
            title: "Error",
            description: "Failed to fetch wallet balance. Retrying...",
            variant: "destructive",
          });
          // Retry after 3 seconds
          setTimeout(fetchBalance, 3000);
        }
      }
    };

    fetchBalance();
    // Set up an interval to refresh the balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [publicKey, connection, onBalanceUpdate, toast]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          SOL Balance <span className="w-2 h-2 bg-green-500 rounded-full" />
        </label>
        <Input disabled value={solBalance.toFixed(4)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          TOKEN Balance <span className="w-2 h-2 bg-green-500 rounded-full" />
        </label>
        <Input disabled value={tokenBalance.toFixed(4)} />
      </div>
    </div>
  );
};

export default WalletBalance;