import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useState, useMemo } from "react";
import { Commitment, clusterApiUrl } from "@solana/web3.js";
import RPCConfig from "./components/RPCConfig";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Initialize buffer for Jupiter
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const queryClient = new QueryClient();

const DEFAULT_RPC = "https://georgianna-k21s7o-fast-mainnet.helius-rpc.com";

const App = () => {
  const [endpoint, setEndpoint] = useState(DEFAULT_RPC);
  const network = WalletAdapterNetwork.Mainnet;
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const connectionConfig = {
    commitment: 'confirmed' as Commitment,
    confirmTransactionInitialTimeout: 120000,
  };

  return (
    <BrowserRouter>
      <AuthProvider>
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
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                          <ProtectedRoute>
                            <Index />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </div>
                </TooltipProvider>
              </QueryClientProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;