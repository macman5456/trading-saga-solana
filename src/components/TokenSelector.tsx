import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useToast } from "@/hooks/use-toast";

interface TokenSelectorProps {
  onTokenSelect: (token: string) => void;
}

const TokenSelector = ({ onTokenSelect }: TokenSelectorProps) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const [tokens, setTokens] = useState<Array<{ address: string; symbol: string }>>([]);
  const [customToken, setCustomToken] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isSubscribed = true;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    const fetchWalletTokens = async () => {
      if (!connected || !publicKey) {
        if (isSubscribed) {
          setTokens([]);
        }
        return;
      }

      if (!isLoading) {
        setIsLoading(true);

        try {
          console.log("Fetching tokens for wallet:", publicKey.toString());
          const balance = await connection.getBalance(publicKey);
          console.log("SOL Balance:", balance / LAMPORTS_PER_SOL);
          
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
          });
          
          console.log("Token accounts fetched:", tokenAccounts.value.length);

          if (!isSubscribed) return;

          const tokenList = [
            {
              address: "SOL",
              symbol: "SOL"
            },
            ...tokenAccounts.value.map(account => ({
              address: account.account.data.parsed.info.mint,
              symbol: `Token (${account.account.data.parsed.info.mint.slice(0, 4)}...)`
            }))
          ];

          setTokens(tokenList);
          setRetryCount(0);
          setIsLoading(false);

        } catch (error) {
          console.error("Error fetching tokens:", error);
          
          if (!isSubscribed) return;

          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              fetchWalletTokens();
            }, RETRY_DELAY);
          } else {
            setIsLoading(false);
            toast({
              title: "Error",
              description: "Failed to fetch wallet tokens. Please try again later.",
              variant: "destructive",
            });
          }
        }
      }
    };

    fetchWalletTokens();

    return () => {
      isSubscribed = false;
    };
  }, [connected, publicKey, retryCount, connection, toast, isLoading]);

  const handleCustomTokenAdd = () => {
    try {
      new PublicKey(customToken);
      
      const newToken = { 
        address: customToken, 
        symbol: `Custom (${customToken.slice(0, 4)}...)`
      };

      setTokens(prevTokens => {
        if (prevTokens.some(token => token.address === customToken)) {
          toast({
            title: "Token Exists",
            description: "This token is already in your list",
          });
          return prevTokens;
        }
        
        toast({
          title: "Success",
          description: "Custom token added successfully",
        });
        
        return [...prevTokens, newToken];
      });
      
      setCustomToken("");
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
          <SelectValue placeholder={connected ? (isLoading ? "Loading tokens..." : "Select a token or enter address") : "Connect wallet first"} />
        </SelectTrigger>
        <SelectContent>
          {connected ? (
            <>
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
              {!isLoading && tokens.length === 0 && (
                <SelectItem value="no-tokens" disabled>
                  No tokens found
                </SelectItem>
              )}
            </>
          ) : (
            <SelectItem value="connect-wallet" disabled>
              Please connect your wallet first
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TokenSelector;