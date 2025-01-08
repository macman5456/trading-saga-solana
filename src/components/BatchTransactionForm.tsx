import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TokenSelector from "./TokenSelector";
import DexSelector from "./DexSelector";
import AddressCounter from "./AddressCounter";
import JitoTip from "./JitoTip";
import { validatePrivateKey, checkWalletBalance, createAndFundWallet, closeWallet } from "@/utils/walletOperations";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Input } from "./ui/input";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

interface BatchTransactionFormProps {
  onWalletsGenerated: (wallets: WalletInfo[]) => void;
  onSuccessCountChange: (count: number) => void;
}

const BatchTransactionForm = ({ onWalletsGenerated, onSuccessCountChange }: BatchTransactionFormProps) => {
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [buyAmount, setBuyAmount] = useState<string>("0.00001");
  const [addressCount, setAddressCount] = useState<number>(4);
  const [jitoTip, setJitoTip] = useState<string>("0.00015");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDexEndpoint, setSelectedDexEndpoint] = useState<string>("https://api.mainnet-beta.solana.com");
  const { toast } = useToast();

  const handlePrivateKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrivateKey(value);
    
    if (!value) {
      setPublicKey("");
      return;
    }

    const keypair = validatePrivateKey(value);
    if (keypair) {
      const pubKey = keypair.publicKey.toString();
      setPublicKey(pubKey);
    } else {
      setPublicKey("");
      toast({
        title: "Invalid Private Key",
        description: "Please enter a valid Solana private key",
        variant: "destructive",
      });
    }
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
    onSuccessCountChange(0);
    const newWallets: WalletInfo[] = [];

    try {
      const connection = new Connection(selectedDexEndpoint, "confirmed");
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

        const walletBalance = await checkWalletBalance(connection, newWallet);
        
        newWallets.push({
          publicKey: newWallet.publicKey.toString(),
          privateKey: Buffer.from(newWallet.secretKey).toString('hex'),
          solBalance: walletBalance / LAMPORTS_PER_SOL,
          tokenBalance: 0
        });

        await closeWallet(
          connection,
          newWallet,
          mainWallet.publicKey
        );

        // Update the success count directly with a number instead of a function
        onSuccessCountChange(i + 1);
        
        toast({
          title: "Success",
          description: `Completed transaction ${i + 1} of ${addressCount}`,
        });
      }

      onWalletsGenerated(newWallets);

    } catch (error: any) {
      console.error("Transaction error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Batch Transactions (Mainnet)</h1>
        <p className="text-muted-foreground">
          Automatically create new wallet addresses, complete the buy transaction,
          transfer to the main wallet, and close the account.
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
        <div className="space-y-2 col-span-3">
          <label className="text-sm font-medium">Address</label>
          <Input 
            disabled 
            placeholder="Address will appear here" 
            value={publicKey}
          />
        </div>
      </div>

      <DexSelector 
        selectedToken={selectedToken} 
        onDexSelect={(dexId, endpoint) => setSelectedDexEndpoint(endpoint)}
      />

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

      <div className="flex flex-col items-center gap-2">
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
  );
};

export default BatchTransactionForm;