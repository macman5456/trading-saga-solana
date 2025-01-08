import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

const WalletList = ({ wallets }: { wallets: WalletInfo[] }) => {
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});

  const togglePrivateKey = (publicKey: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [publicKey]: !prev[publicKey]
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Generated Wallets</h2>
      <div className="space-y-3">
        {wallets.map((wallet) => (
          <Card key={wallet.publicKey} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Public Key:</span>
                <span className="text-sm font-mono">{wallet.publicKey}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Private Key:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    {showPrivateKeys[wallet.publicKey] 
                      ? wallet.privateKey 
                      : "••••••••••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePrivateKey(wallet.publicKey)}
                  >
                    {showPrivateKeys[wallet.publicKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">SOL Balance:</span>
                <span>{wallet.solBalance.toFixed(6)} SOL</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Token Balance:</span>
                <span>{wallet.tokenBalance.toFixed(6)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WalletList;