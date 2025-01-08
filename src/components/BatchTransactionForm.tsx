import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TokenSelector from "./TokenSelector";
import DexSelector from "./DexSelector";
import JitoTip from "./JitoTip";
import { validatePrivateKey, checkWalletBalance, createAndFundWallet, closeWallet } from "@/utils/walletOperations";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import WalletManagement from "./wallet/WalletManagement";
import BatchTransactionHeader from "./batch-transaction/BatchTransactionHeader";
import WalletInputSection from "./batch-transaction/WalletInputSection";
import TransactionControls from "./batch-transaction/TransactionControls";

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

const DEFAULT_HELIUS_RPC = "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com";

const BatchTransactionForm = ({ onWalletsGenerated, onSuccessCountChange }: BatchTransactionFormProps) => {
  const [privateKey, setPrivateKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [buyAmount, setBuyAmount] = useState<string>("0.00001");
  const [addressCount, setAddressCount] = useState<number>(4);
  const [jitoTip, setJitoTip] = useState<string>("0.00015");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDexEndpoint, setSelectedDexEndpoint] = useState<string>(DEFAULT_HELIUS_RPC);
  const [solBalance, setSolBalance] = useState("0");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const { toast } = useToast();

  const handlePrivateKeyChange = async (value: string) => {
    setPrivateKey(value);
    setBalanceError(null);
    
    if (!value) {
      setPublicKey("");
      setSolBalance("0");
      setTokenBalance("0");
      return;
    }

    const keypair = validatePrivateKey(value);
    if (keypair) {
      const pubKey = keypair.publicKey.toString();
      setPublicKey(pubKey);
      
      setIsLoadingBalance(true);
      try {
        const connection = new Connection(selectedDexEndpoint, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000
        });
        
        const balance = await checkWalletBalance(connection, keypair);
        setSolBalance((balance / LAMPORTS_PER_SOL).toFixed(4));
        setBalanceError(null);
      } catch (error: any) {
        console.error("Error fetching balance:", error);
        setBalanceError(error.message || "Failed to fetch balance");
        toast({
          title: "Error",
          description: "Failed to fetch wallet balance",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBalance(false);
      }
    } else {
      setPublicKey("");
      setSolBalance("0");
      setTokenBalance("0");
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

        onSuccessCountChange(i + 1);
        
        toast({
          title: "Success",
          description: `Completed transaction ${i + 1} of ${addressCount}`,
        });
      }

      setWallets(prevWallets => [...prevWallets, ...newWallets]);
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

  const handleWalletsImported = (importedWallets: WalletInfo[]) => {
    setWallets(prevWallets => [...prevWallets, ...importedWallets]);
    onWalletsGenerated(importedWallets);
  };

  return (
    <div className="space-y-8">
      <BatchTransactionHeader />
      <TokenSelector onTokenSelect={setSelectedToken} />
      <WalletInputSection
        privateKey={privateKey}
        publicKey={publicKey}
        solBalance={solBalance}
        tokenBalance={tokenBalance}
        isLoadingBalance={isLoadingBalance}
        balanceError={balanceError}
        onPrivateKeyChange={handlePrivateKeyChange}
      />
      <DexSelector 
        selectedToken={selectedToken} 
        onDexSelect={(dexId, endpoint) => setSelectedDexEndpoint(endpoint)}
      />
      <TransactionControls
        addressCount={addressCount}
        buyAmount={buyAmount}
        isProcessing={isProcessing}
        disabled={!privateKey}
        onAddressCountChange={setAddressCount}
        onBuyAmountChange={setBuyAmount}
        onStartTransaction={handleBatchTransaction}
      />
      <JitoTip onTipChange={setJitoTip} />
      <WalletManagement 
        wallets={wallets}
        onWalletsImported={handleWalletsImported}
        mainWalletPrivateKey={privateKey}
        rpcEndpoint={selectedDexEndpoint}
      />
    </div>
  );
};

export default BatchTransactionForm;