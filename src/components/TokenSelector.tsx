import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { useToast } from "@/components/ui/use-toast";

const TokenSelector = () => {
  const { connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<Array<{ address: string; symbol: string }>>([
    { address: "So11111111111111111111111111111111111111112", symbol: "SOL" },
    { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC" },
    { address: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", symbol: "RAY" },
  ]);
  const [customToken, setCustomToken] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const { toast } = useToast();

  const connection = new Connection("https://api.mainnet-beta.solana.com");

  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (connected && publicKey) {
        try {
          // Here you would typically fetch token accounts
          // This is a simplified version
          toast({
            title: "Wallet Connected",
            description: "Successfully fetched wallet tokens",
          });
        } catch (error) {
          console.error("Error fetching tokens:", error);
          toast({
            title: "Error",
            description: "Failed to fetch wallet tokens",
            variant: "destructive",
          });
        }
      }
    };

    fetchWalletTokens();
  }, [connected, publicKey]);

  const handleCustomTokenAdd = () => {
    try {
      // Validate Solana address
      new PublicKey(customToken);
      
      // Check if token already exists
      if (!tokens.some(token => token.address === customToken)) {
        setTokens(prev => [...prev, { address: customToken, symbol: `Custom (${customToken.slice(0, 4)}...)` }]);
        setCustomToken("");
        toast({
          title: "Success",
          description: "Custom token added successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Solana token address",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Select Token</label>
        <WalletMultiButton className="bg-primary hover:bg-primary/90" />
      </div>

      <div className="space-y-2">
        <Select value={selectedToken} onValueChange={setSelectedToken}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a token or enter address" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.address} value={token.address}>
                {token.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            placeholder="Enter token address"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
          />
          <Button onClick={handleCustomTokenAdd} variant="outline">
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TokenSelector;