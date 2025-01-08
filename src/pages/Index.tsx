import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TokenSelector from "@/components/TokenSelector";
import DexSelector from "@/components/DexSelector";
import AddressCounter from "@/components/AddressCounter";
import JitoTip from "@/components/JitoTip";
import WalletBalance from "@/components/WalletBalance";
import { useState } from "react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Keypair } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";
import { validatePrivateKey, checkWalletBalance, createAndFundWallet, closeWallet } from "@/utils/walletOperations";

const Index = () => {
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const { toast } = useToast();
  const [selectedToken, setSelectedToken] = useState("");
  const [buyAmount, setBuyAmount] = useState<string>("0.00001");
  const [addressCount, setAddressCount] = useState<number>(4);
  const [jitoTip, setJitoTip] = useState<string>("0.00015");
  const [isProcessing, setIsProcessing] = useState(false);

  const connection = new Connection(
    "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com",
    "confirmed"
  );

  const handlePrivateKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrivateKey(value);
    
    if (!value) {
      setPublicKey("");
      setSolBalance(0);
      setTokenBalance(0);
      return;
    }

    const keypair = validatePrivateKey(value);
    if (keypair) {
      const pubKey = keypair.publicKey.toString();
      setPublicKey(pubKey);
    } else {
      setPublicKey("");
      setSolBalance(0);
      setTokenBalance(0);
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid Solana private key",
        variant: "destructive",
      });
    }
  };

  const handleBalanceUpdate = (newSolBalance: number, newTokenBalance: number) => {
    setSolBalance(newSolBalance);
    setTokenBalance(newTokenBalance);
  };

  const handleBatchTransaction = async () => {
    if (!privateKey) {
      toast({
        title: "Error",
        description: "Please enter a valid private key first",
        variant: "destructive",
      });
      return;
    }

    const mainWallet = validatePrivateKey(privateKey);
    if (!mainWallet) {
      toast({
        title: "Error",
        description: "Invalid private key",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    let successCount = 0;

    try {
      const initialBalance = await checkWalletBalance(connection, mainWallet);
      console.log("Initial balance:", initialBalance / LAMPORTS_PER_SOL, "SOL");

      for (let i = 0; i < addressCount; i++) {
        toast({
          title: "Processing",
          description: `Creating wallet ${i + 1} of ${addressCount}`,
        });

        const newWallet = await createAndFundWallet(
          connection,
          parseFloat(buyAmount),
          parseFloat(jitoTip),
          mainWallet
        );

        console.log(`New wallet ${i + 1} created:`, newWallet.publicKey.toString());

        await closeWallet(
          connection,
          newWallet,
          mainWallet.publicKey
        );

        successCount++;
        toast({
          title: "Success",
          description: `Completed transaction ${i + 1} of ${addressCount}`,
        });
      }

      const newBalance = await checkWalletBalance(connection, mainWallet);
      setSolBalance(newBalance / LAMPORTS_PER_SOL);

    } catch (error: any) {
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: error.message || `Failed after completing ${successCount} transactions. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Batch Transactions (Mainnet)</h1>
          <p className="text-muted-foreground">
            Automatically create new wallet addresses, complete the buy transaction,
            transfer to the main wallet, and close the account. Boost the number of
            independent wallet purchases of designated tokens at a very low cost,
            helping your project's data stand out in the market.
          </p>
        </div>

        <TokenSelector onTokenSelect={setSelectedToken} />

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
          <WalletBalance 
            publicKey={publicKey} 
            onBalanceUpdate={handleBalanceUpdate}
          />
        </div>

        <DexSelector selectedToken={selectedToken} />

        <div className="grid grid-cols-2 gap-4">
          <AddressCounter onCountChange={setAddressCount} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Buy Amount(SOL)</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00001"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min="0.00001"
                step="0.00001"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                SOL
              </span>
            </div>
          </div>
        </div>

        <JitoTip onTipChange={setJitoTip} />

        <div className="flex flex-col items-center gap-2 mt-6">
          <Button
            className="bg-primary hover:bg-primary/90 text-white w-40"
            onClick={handleBatchTransaction}
            disabled={isProcessing || !privateKey}
          >
            {isProcessing ? "Processing..." : "Start"}
          </Button>
          <p className="text-sm text-muted-foreground">
            The lowest service fee in the market, with each new address buy costing
            only 0.00009 SOL.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
