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
    rpcEndpoint: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  },
  { 
    id: "pump", 
    name: "Pump", 
    icon: "🎯",
    rpcEndpoint: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  },
  { 
    id: "moonshot", 
    name: "MoonShot", 
    icon: "🌙",
    rpcEndpoint: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  },
];