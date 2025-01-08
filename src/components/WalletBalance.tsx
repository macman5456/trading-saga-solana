import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import { useConnection } from "@solana/wallet-adapter-react";

interface WalletBalanceProps {
  publicKey: string;
  onBalanceUpdate: (solBalance: number, tokenBalance: number) => void;
}

const WalletBalance = ({ publicKey, onBalanceUpdate }: WalletBalanceProps) => {
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { connection } = useConnection();
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Minimum time between fetches (5 seconds)
  const FETCH_COOLDOWN = 5000;

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(0);
      setTokenBalance(0);
      return;
    }

    const now = Date.now();
    if (now - lastFetchTime < FETCH_COOLDOWN) {
      return; // Skip if we fetched recently
    }

    setIsLoading(true);
    setLastFetchTime(now);
    setError(null);

    try {
      let pubKey: PublicKey;
      try {
        pubKey = new PublicKey(publicKey);
      } catch (error) {
        console.error("Invalid public key format:", error);
        setError("Invalid wallet address format");
        toast({
          title: "Error",
          description: "Invalid wallet address format",
          variant: "destructive",
        });
        return;
      }

      console.log("Fetching balance for:", pubKey.toString());
      
      // Retry mechanism for balance fetch
      let balance = 0;
      for (let i = 0; i < 3; i++) {
        try {
          balance = await connection.getBalance(pubKey);
          break;
        } catch (error) {
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      
      console.log("Retrieved balance:", balance / LAMPORTS_PER_SOL, "SOL");
      
      const newSolBalance = balance / LAMPORTS_PER_SOL;
      setSolBalance(newSolBalance);
      onBalanceUpdate(newSolBalance, 0);
      
    } catch (error) {
      console.error("Error fetching balance:", error);
      setError("Failed to fetch balance");
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance. Retrying...",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, onBalanceUpdate, toast, lastFetchTime]);

  useEffect(() => {
    fetchBalance();
    
    // Set up an interval to refresh the balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          SOL Balance 
          {isLoading ? (
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          ) : error ? (
            <span className="w-2 h-2 bg-red-500 rounded-full" />
          ) : (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </label>
        <Input disabled value={error ? "Error fetching" : solBalance.toFixed(4)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          TOKEN Balance 
          {isLoading ? (
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          ) : error ? (
            <span className="w-2 h-2 bg-red-500 rounded-full" />
          ) : (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </label>
        <Input disabled value={error ? "Error fetching" : tokenBalance.toFixed(4)} />
      </div>
    </div>
  );
};

export default WalletBalance;