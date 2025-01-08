import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

interface TokenSelectorProps {
  onTokenSelect: (token: string) => void;
}

const TokenSelector = ({ onTokenSelect }: TokenSelectorProps) => {
  const { connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<Array<{ address: string; symbol: string }>>([]);
  const [customToken, setCustomToken] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const { toast } = useToast();

  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

  useEffect(() => {
    const fetchWalletTokens = async () => {
      if (connected && publicKey) {
        try {
          console.log("Fetching tokens for wallet:", publicKey.toString());
          const balance = await connection.getBalance(publicKey);
          console.log("SOL Balance:", balance / LAMPORTS_PER_SOL);
          
          toast({
            title: "Wallet Connected",
            description: "Scanning for tokens in your wallet...",
          });

          // For now, just add SOL as a token
          setTokens([{
            address: "SOL",
            symbol: "SOL"
          }]);

        } catch (error) {
          console.error("Error fetching tokens:", error);
          toast({
            title: "Error",
            description: "Failed to fetch wallet tokens",
            variant: "destructive",
          });
        }
      } else {
        setTokens([]);
      }
    };

    fetchWalletTokens();
  }, [connected, publicKey, connection]);

  const handleCustomTokenAdd = () => {
    try {
      new PublicKey(customToken);
      
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

  const handleTokenSelect = (value: string) => {
    setSelectedToken(value);
    onTokenSelect(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Select Token</label>
        <WalletMultiButton className="bg-primary hover:bg-primary/90" />
      </div>

      <Select value={selectedToken} onValueChange={handleTokenSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a token or enter address" />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              placeholder="Enter token address"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              className="mb-2"
            />
            <Button onClick={handleCustomTokenAdd} variant="outline" className="w-full mb-2">
              Add Custom Token
            </Button>
          </div>
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
  );
};

export default TokenSelector;