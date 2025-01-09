import { useState } from "react";
import BatchTransactionForm from "@/components/BatchTransactionForm";
import TransactionLog from "@/components/TransactionLog";
import TokenSelector from "@/components/TokenSelector";
import WalletManagement from "@/components/wallet/WalletManagement";
import DexSelector from "@/components/DexSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

const Index = () => {
  const [successCount, setSuccessCount] = useState<number>(0);
  const [generatedWallets, setGeneratedWallets] = useState<WalletInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>("");
  const [selectedDex, setSelectedDex] = useState<string>("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");
  const { signOut } = useAuth();

  const handleDexSelect = (dex: string, endpoint: string) => {
    setSelectedDex(dex);
    setSelectedEndpoint(endpoint);
  };

  return (
    <div className="relative min-h-screen">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-8">
            <TokenSelector onTokenSelect={setSelectedToken} />
            <DexSelector 
              selectedToken={selectedToken}
              onDexSelect={handleDexSelect}
            />
            <BatchTransactionForm 
              onWalletsGenerated={setGeneratedWallets}
              onSuccessCountChange={setSuccessCount}
              selectedToken={selectedToken}
              selectedDex={selectedDex}
            />
            <WalletManagement 
              wallets={generatedWallets} 
              onWalletsImported={setGeneratedWallets}
              mainWalletPrivateKey=""
              rpcEndpoint={selectedEndpoint}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4 z-10">
            <TransactionLog successCount={successCount} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;