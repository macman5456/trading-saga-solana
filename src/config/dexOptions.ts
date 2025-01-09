export interface DexOption {
  id: string;
  name: string;
  icon: string;
  rpcEndpoint: string;
}

export const dexOptions: DexOption[] = [
  { 
    id: "jupiter", 
    name: "Jupiter", 
    icon: "🚀",
    rpcEndpoint: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  },
  { 
    id: "raydium", 
    name: "Raydium", 
    icon: "🔸",
    rpcEndpoint: "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com"
  },
];