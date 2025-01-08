export interface DexOption {
  id: string;
  name: string;
  icon: string;
  rpcEndpoint: string;
}

export const dexOptions: DexOption[] = [
  { 
    id: "raydium", 
    name: "Raydium", 
    icon: "🔸",
    rpcEndpoint: "https://api.mainnet-beta.solana.com" 
  },
  { 
    id: "pump", 
    name: "Pump", 
    icon: "🎯",
    rpcEndpoint: "https://pump.rpc.fun"
  },
  { 
    id: "moonshot", 
    name: "MoonShot", 
    icon: "🌙",
    rpcEndpoint: "https://moonshot.rpc.network"
  },
];