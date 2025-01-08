import { useState, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RPCConfigProps {
  onRPCChange: (url: string) => void;
}

const RPCConfig = ({ onRPCChange }: RPCConfigProps) => {
  const [rpcUrl, setRpcUrl] = useState("https://api.mainnet-beta.solana.com");
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const startTime = performance.now();
      const connection = new Connection(rpcUrl, "confirmed");
      await connection.getSlot();
      const endTime = performance.now();
      
      setLatency(Math.round(endTime - startTime));
      setIsConnected(true);
      onRPCChange(rpcUrl);
      
      toast({
        title: "RPC Connected",
        description: `Successfully connected to RPC endpoint`,
      });
    } catch (error) {
      console.error("RPC Connection error:", error);
      setIsConnected(false);
      setLatency(null);
      toast({
        title: "RPC Connection Failed",
        description: "Failed to connect to RPC endpoint. Please try another endpoint.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Enter RPC URL"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          onClick={checkConnection}
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {latency && <span className="text-sm">{latency}ms</span>}
        </div>
      </div>
    </div>
  );
};

export default RPCConfig;