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
  const { toast } = useToast();
  const { connection } = useConnection();
  
  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setSolBalance(0);
      setTokenBalance(0);
      return;
    }

    setIsLoading(true);

    try {
      let pubKey: PublicKey;
      try {
        pubKey = new PublicKey(publicKey);
      } catch (error) {
        console.error("Invalid public key format:", error);
        toast({
          title: "Error",
          description: "Invalid wallet address format",
          variant: "destructive",
        });
        return;
      }

      console.log("Fetching balance for:", pubKey.toString());
      
      const balance = await connection.getBalance(pubKey);
      console.log("Retrieved balance:", balance / LAMPORTS_PER_SOL, "SOL");
      
      const newSolBalance = balance / LAMPORTS_PER_SOL;
      setSolBalance(newSolBalance);
      
      // For now, we're setting token balance to 0 since we haven't implemented token balance fetching yet
      setTokenBalance(0);
      
      onBalanceUpdate(newSolBalance, 0);
      
    } catch (error) {
      console.error("Error fetching balance:", error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, onBalanceUpdate, toast]);

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
          ) : (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </label>
        <Input 
          disabled 
          value={solBalance.toFixed(4)} 
          className="bg-white dark:bg-gray-800"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          TOKEN Balance 
          {isLoading ? (
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          ) : (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </label>
        <Input 
          disabled 
          value={tokenBalance.toFixed(4)} 
          className="bg-white dark:bg-gray-800"
        />
      </div>
    </div>
  );
};

export default WalletBalance;