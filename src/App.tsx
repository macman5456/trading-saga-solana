import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useState, useMemo } from "react";
import { Commitment } from "@solana/web3.js";
import RPCConfig from "./components/RPCConfig";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient();

// GenesysGo is more reliable and doesn't require API keys
const DEFAULT_RPC = "https://ssc-dao.genesysgo.net";

const App = () => {
  const [endpoint, setEndpoint] = useState(DEFAULT_RPC);
  const network = WalletAdapterNetwork.Mainnet;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Configure connection settings
  const connectionConfig = {
    commitment: 'confirmed' as Commitment,
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 60000
  };

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <div className="min-h-screen bg-background">
                <div className="container mx-auto p-4">
                  <RPCConfig onRPCChange={setEndpoint} defaultEndpoint={DEFAULT_RPC} />
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                    </Routes>
                  </BrowserRouter>
                </div>
              </div>
            </TooltipProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;