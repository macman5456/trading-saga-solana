import { useState, useEffect } from "react";
import { Connection } from "@solana/web3.js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RPCConfigProps {
  onRPCChange: (url: string) => void;
  defaultEndpoint: string;
}

// Only use Helius RPC endpoint
const DEFAULT_RPC_ENDPOINTS = [
  {
    name: "Helius RPC",
    url: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  }
];

const RPCConfig = ({ onRPCChange, defaultEndpoint }: RPCConfigProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(DEFAULT_RPC_ENDPOINTS[0].url);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const { toast } = useToast();

  const checkConnection = async (url: string) => {
    if (!url) return;
    
    setIsLoading(true);
    try {
      const startTime = performance.now();
      const connection = new Connection(url);
      
      const version = await connection.getVersion();
      const endTime = performance.now();
      
      console.log("RPC Version:", version);
      setLatency(Math.round(endTime - startTime));
      setIsConnected(true);
      onRPCChange(url);
      
      toast({
        title: "RPC Connected",
        description: `Successfully connected to Helius RPC endpoint`,
      });
    } catch (error) {
      console.error("RPC Connection error:", error);
      setIsConnected(false);
      setLatency(null);
      
      toast({
        title: "Connection Failed",
        description: "Failed to connect to RPC endpoint",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection(selectedEndpoint);
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedEndpoint}
          onValueChange={(value) => {
            setSelectedEndpoint(value);
            checkConnection(value);
          }}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select RPC endpoint" />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_RPC_ENDPOINTS.map((endpoint) => (
              <SelectItem 
                key={endpoint.name} 
                value={endpoint.url}
              >
                {endpoint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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