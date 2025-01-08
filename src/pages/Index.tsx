import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TokenSelector from "@/components/TokenSelector";
import DexSelector from "@/components/DexSelector";
import AddressCounter from "@/components/AddressCounter";
import JitoTip from "@/components/JitoTip";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import bs58 from "bs58";

const Index = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const { toast } = useToast();

  // Use a reliable public RPC endpoint
  const connection = new Connection("https://api.devnet.solana.com", {
    commitment: "confirmed",
  });

  const handlePrivateKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrivateKey(value);
    
    try {
      if (value) {
        const decodedKey = bs58.decode(value);
        const keypair = Keypair.fromSecretKey(decodedKey);
        const pubKey = keypair.publicKey.toString();
        setPublicKey(pubKey);
        
        // Fetch balance immediately after setting public key
        const balance = await connection.getBalance(keypair.publicKey);
        console.log("Retrieved SOL balance:", balance);
        setSolBalance(balance / LAMPORTS_PER_SOL);
      } else {
        setPublicKey("");
        setSolBalance(0);
        setTokenBalance(0);
      }
    } catch (error) {
      console.error("Error processing private key:", error);
      setPublicKey("");
      setSolBalance(0);
      setTokenBalance(0);
      if (value) {
        toast({
          title: "Invalid Private Key",
          description: "Please enter a valid Solana private key",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    const fetchBalances = async () => {
      if (publicKey) {
        try {
          console.log("Fetching balance for address:", publicKey);
          const solBalance = await connection.getBalance(new PublicKey(publicKey));
          console.log("Retrieved SOL balance:", solBalance);
          setSolBalance(solBalance / LAMPORTS_PER_SOL);
          
          // For now, we'll reset token balance when address changes
          // Token balance will be updated when a specific token is selected
          setTokenBalance(0);
        } catch (error) {
          console.error("Error fetching balances:", error);
          setSolBalance(0);
          setTokenBalance(0);
        }
      }
    };

    fetchBalances();
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Batch Transactions</h1>
          <p className="text-muted-foreground">
            Automatically create new wallet addresses, complete the buy transaction,
            transfer to the main wallet, and close the account. Boost the number of
            independent wallet purchases of designated tokens at a very low cost,
            helping your project's data stand out in the market.
          </p>
        </div>

        <div className="space-y-6">
          <TokenSelector />

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Private Key</label>
              <Input 
                type="password" 
                placeholder="Enter Private Key" 
                value={privateKey}
                onChange={handlePrivateKeyChange}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Input 
                disabled 
                placeholder="Address will appear here" 
                value={publicKey}
              />
            </div>
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
          </div>

          <DexSelector />

          <div className="grid grid-cols-2 gap-4">
            <AddressCounter />
            <div className="space-y-2">
              <label className="text-sm font-medium">Buy Amount(SOL)</label>
              <div className="relative">
                <Input placeholder="0.00001" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  SOL
                </span>
              </div>
            </div>
          </div>

          <JitoTip />

          <Alert className="bg-orange-50 border-orange-200">
            <AlertDescription className="flex items-center justify-between text-orange-800">
              <span>
                The cost for each new address buy is primarily the Jito fee. Please
                adjust in real-time based on network congestion. Do not refresh
                after the feature is enabled, as this will interrupt the service.
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="text-orange-800 hover:text-orange-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-center gap-2">
            <Button className="bg-primary hover:bg-primary/90 text-white w-40">
              Start
            </Button>
            <p className="text-sm text-muted-foreground">
              The lowest service fee in the market, with each new address buy
              costing only 0.00009 SOL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

};

export default Index;
