import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

const TokenSelector = () => {
  const { connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<Array<{ address: string; symbol: string }>>([]);
  const [customToken, setCustomToken] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const { toast } = useToast();

  const connection = new Connection("https://api.mainnet-beta.solana.com");

  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (connected && publicKey) {
        try {
          // Here you would fetch token accounts from the connected wallet
          // This is a placeholder - you would implement the actual token fetching logic
          toast({
            title: "Wallet Connected",
            description: "Scanning for tokens in your wallet...",
          });
          
          // Reset tokens when wallet connects
          setTokens([]);
        } catch (error) {
          console.error("Error fetching tokens:", error);
          toast({
            title: "Error",
            description: "Failed to fetch wallet tokens",
            variant: "destructive",
          });
        }
      } else {
        // Clear tokens when wallet disconnects
        setTokens([]);
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
      } else {
        toast({
          title: "Token Exists",
          description: "This token is already in your list",
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
        <div className="flex gap-2">
          <Input
            placeholder="Enter token address"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleCustomTokenAdd} variant="outline">
            Add
          </Button>
        </div>

        <Select value={selectedToken} onValueChange={setSelectedToken}>
          <SelectTrigger>
            <SelectValue placeholder="Select a token or enter address" />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.address} value={token.address}>
                {token.symbol}
              </SelectItem>
            ))}
            {tokens.length === 0 && (
              <SelectItem value="no-tokens" disabled>
                {connected ? "No tokens found" : "Connect wallet to view tokens"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TokenSelector;