import { useState, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface RPCConfigProps {
  onRPCChange: (url: string) => void;
}

const RPCConfig = ({ onRPCChange }: RPCConfigProps) => {
  const [rpcUrl, setRpcUrl] = useState("https://solana-mainnet.rpc.extrnode.com");
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const { toast } = useToast();

  const checkConnection = async () => {
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
        description: `Successfully connected to ${rpcUrl}`,
      });
    } catch (error) {
      setIsConnected(false);
      setLatency(null);
      toast({
        title: "RPC Connection Failed",
        description: "Failed to connect to RPC endpoint",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Enter RPC URL"
          value={rpcUrl}
          onChange={(e) => setRpcUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={checkConnection}>Connect</Button>
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