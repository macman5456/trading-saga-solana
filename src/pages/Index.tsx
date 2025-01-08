import { useState } from "react";
import BatchTransactionForm from "@/components/BatchTransactionForm";
import TransactionLog from "@/components/TransactionLog";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

const Index = () => {
  const [successCount, setSuccessCount] = useState<number>(0);
  const [generatedWallets, setGeneratedWallets] = useState<WalletInfo[]>([]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form Area */}
      <div className="lg:col-span-2">
        <BatchTransactionForm 
          onWalletsGenerated={setGeneratedWallets}
          onSuccessCountChange={setSuccessCount}
        />
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <TransactionLog successCount={successCount} />
        </div>
      </div>
    </div>
  );
};

export default Index;