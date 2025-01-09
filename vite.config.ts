import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    'global': {},
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
      supported: { 
        bigint: true 
      },
    },
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      '@jup-ag/core',
      'bs58',
    ]
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      external: ['@jup-ag/common'],
    }
  },
});