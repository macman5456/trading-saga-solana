import { useState, useEffect } from "react";
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
  const { toast } = useToast();
  const { connection } = useConnection();

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setSolBalance(0);
        setTokenBalance(0);
        return;
      }

      try {
        // Validate public key format first
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
        console.log("Using connection:", connection.rpcEndpoint);

        const balance = await connection.getBalance(pubKey);
        console.log("Retrieved balance:", balance / LAMPORTS_PER_SOL, "SOL");
        
        const newSolBalance = balance / LAMPORTS_PER_SOL;
        setSolBalance(newSolBalance);
        onBalanceUpdate(newSolBalance, 0); // Update parent component
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance. Please check your connection and try again.",
          variant: "destructive",
        });
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