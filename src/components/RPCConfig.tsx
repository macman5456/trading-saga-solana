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

const DEFAULT_RPC_ENDPOINTS = [
  {
    name: "Mainnet Beta",
    url: "https://api.mainnet-beta.solana.com",
  },
  {
    name: "GenesysGo",
    url: "https://ssc-dao.genesysgo.net",
  },
  {
    name: "Custom",
    url: "",
  },
];

const RPCConfig = ({ onRPCChange, defaultEndpoint }: RPCConfigProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(defaultEndpoint);
  const [customRpcUrl, setCustomRpcUrl] = useState("");
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
        description: `Successfully connected to RPC endpoint`,
      });
    } catch (error: any) {
      console.error("RPC Connection error:", error);
      setIsConnected(false);
      setLatency(null);
      
      let errorMessage = "Failed to connect to RPC endpoint.";
      if (error.message.includes("403")) {
        errorMessage = "Access denied. Please try a different endpoint.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timed out. Please try a different endpoint.";
      } else if (error.message.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try a different endpoint.";
      }
      
      toast({
        title: "RPC Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndpointChange = (value: string) => {
    if (value === "custom") {
      setSelectedEndpoint("custom");
    } else {
      setSelectedEndpoint(value);
      checkConnection(value);
    }
  };

  useEffect(() => {
    if (selectedEndpoint && selectedEndpoint !== "custom") {
      checkConnection(selectedEndpoint);
    }
  }, []);

  return (
    <div className="space-y-4 p-4 border rounded-lg mb-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedEndpoint}
          onValueChange={handleEndpointChange}
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select RPC endpoint" />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_RPC_ENDPOINTS.map((endpoint) => (
              <SelectItem 
                key={endpoint.name} 
                value={endpoint.url || "custom"}
              >
                {endpoint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedEndpoint === "custom" && (
          <Input
            placeholder="Enter custom RPC URL"
            value={customRpcUrl}
            onChange={(e) => setCustomRpcUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
        )}

        {selectedEndpoint === "custom" && (
          <Button 
            onClick={() => checkConnection(customRpcUrl)}
            disabled={isLoading || !customRpcUrl}
          >
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        )}

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