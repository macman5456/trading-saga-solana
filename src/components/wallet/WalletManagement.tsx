import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import WalletList from "../WalletList";
import { Connection, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { validatePrivateKey } from "@/utils/walletOperations";

interface WalletInfo {
  publicKey: string;
  privateKey: string;
  solBalance: number;
  tokenBalance: number;
}

interface WalletManagementProps {
  wallets: WalletInfo[];
  onWalletsImported: (wallets: WalletInfo[]) => void;
  mainWalletPrivateKey: string;
  rpcEndpoint: string;
}

const WalletManagement = ({ 
  wallets, 
  onWalletsImported, 
  mainWalletPrivateKey,
  rpcEndpoint 
}: WalletManagementProps) => {
  const [isRefunding, setIsRefunding] = useState(false);
  const { toast } = useToast();

  const handleRefundAll = async () => {
    if (!mainWalletPrivateKey) {
      toast({
        title: "Error",
        description: "Main wallet private key is required",
        variant: "destructive",
      });
      return;
    }

    const mainWallet = validatePrivateKey(mainWalletPrivateKey);
    if (!mainWallet) {
      toast({
        title: "Error",
        description: "Invalid main wallet private key",
        variant: "destructive",
      });
      return;
    }

    setIsRefunding(true);
    const connection = new Connection(rpcEndpoint, "confirmed");

    try {
      toast({
        title: "Processing",
        description: "Starting refund process...",
      });

      for (const wallet of wallets) {
        const walletKeypair = validatePrivateKey(wallet.privateKey);
        if (!walletKeypair) continue;

        const balance = await connection.getBalance(walletKeypair.publicKey);
        if (balance <= 0) continue;

        // Calculate transfer amount (leaving enough for rent)
        const minimumRent = await connection.getMinimumBalanceForRentExemption(0);
        const transferAmount = balance - minimumRent;

        if (transferAmount <= 0) continue;

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: walletKeypair.publicKey,
            toPubkey: mainWallet.publicKey,
            lamports: transferAmount,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletKeypair.publicKey;

        transaction.sign(walletKeypair);
        
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );

        await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight: await connection.getBlockHeight(),
        });

        console.log(`Refunded ${transferAmount / LAMPORTS_PER_SOL} SOL from ${walletKeypair.publicKey.toString()}`);
      }

      toast({
        title: "Success",
        description: "All wallets have been refunded",
      });
    } catch (error: any) {
      console.error("Refund error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to refund wallets",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Generated Wallets</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={handleRefundAll}
            disabled={isRefunding || wallets.length === 0}
          >
            {isRefunding ? "Refunding..." : "Refund All to Main Wallet"}
          </Button>
        </div>
      </div>

      <WalletList 
        wallets={wallets} 
        onWalletsImported={onWalletsImported}
      />
    </div>
  );
};

export default WalletManagement;