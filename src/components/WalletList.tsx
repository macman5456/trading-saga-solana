import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Download } from "lucide-react";
import WalletFileUpload from "./form/WalletFileUpload";
import { useToast } from "@/hooks/use-toast";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

interface WalletListProps {
  wallets: WalletInfo[];
  onWalletsImported?: (wallets: WalletInfo[]) => void;
}

const WalletList = ({ wallets, onWalletsImported }: WalletListProps) => {
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  const togglePrivateKey = (publicKey: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [publicKey]: !prev[publicKey]
    }));
  };

  const handleExportCSV = () => {
    try {
      const csvContent = [
        ['Public Key', 'Private Key', 'SOL Balance', 'Token Balance'].join(','),
        ...wallets.map(wallet => [
          wallet.publicKey,
          wallet.privateKey,
          wallet.solBalance.toFixed(6),
          wallet.tokenBalance.toFixed(6)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'wallets.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Wallets exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export wallets",
        variant: "destructive",
      });
    }
  };

  const handleWalletsImported = (importedWallets: { publicKey: string; privateKey: string }[]) => {
    if (onWalletsImported) {
      const walletsWithBalance = importedWallets.map(wallet => ({
        ...wallet,
        solBalance: 0,
        tokenBalance: 0
      }));
      onWalletsImported(walletsWithBalance);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  return (
    <div className="space-y-4">
      {wallets.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {wallets.map((wallet) => (
          <Card key={wallet.publicKey} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Public Key:</span>
                <span className="text-sm font-mono">{truncateAddress(wallet.publicKey)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Private Key:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    {showPrivateKeys[wallet.publicKey] 
                      ? truncateAddress(wallet.privateKey)
                      : "•••••"}
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

      <div className="mt-4">
        <WalletFileUpload onWalletsImported={handleWalletsImported} />
      </div>
    </div>
  );
};

export default WalletList;