import { http, createConfig } from "wagmi";
import {
  mainnet, sepolia,
  base, baseSepolia,
  optimism, optimismSepolia,
  arbitrum, arbitrumSepolia,
  polygon, polygonAmoy,
} from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

/**
 * wagmi config.
 *
 * Uses injected() (MetaMask / any browser wallet) and Coinbase Wallet.
 * WalletConnect is omitted to keep the static build dependency-free
 * (WalletConnect requires a project ID from cloud.walletconnect.com).
 * Add it back if you want QR-code mobile support:
 *
 *   import { walletConnect } from "wagmi/connectors"
 *   walletConnect({ projectId: "YOUR_PROJECT_ID" })
 */
export const wagmiConfig = createConfig({
  chains: [
    baseSepolia, base,
    optimismSepolia, optimism,
    arbitrumSepolia, arbitrum,
    polygonAmoy, polygon,
    sepolia, mainnet,
  ],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "Chainstreak" }),
  ],
  transports: {
    [mainnet.id]:         http(),
    [sepolia.id]:         http(),
    [base.id]:            http(),
    [baseSepolia.id]:     http(),
    [optimism.id]:        http(),
    [optimismSepolia.id]: http(),
    [arbitrum.id]:        http(),
    [arbitrumSepolia.id]: http(),
    [polygon.id]:         http(),
    [polygonAmoy.id]:     http(),
  },
  ssr: false,   // Must be false for static export
});

export const CHAIN_META: Record<number, { name: string; symbol: string; color: string; testnet?: boolean }> = {
  1:        { name: "Ethereum",      symbol: "ETH",  color: "#627EEA" },
  11155111: { name: "Sepolia",       symbol: "ETH",  color: "#627EEA", testnet: true },
  8453:     { name: "Base",          symbol: "ETH",  color: "#0052FF" },
  84532:    { name: "Base Sepolia",  symbol: "ETH",  color: "#0052FF", testnet: true },
  10:       { name: "Optimism",      symbol: "ETH",  color: "#FF0420" },
  11155420: { name: "OP Sepolia",    symbol: "ETH",  color: "#FF0420", testnet: true },
  42161:    { name: "Arbitrum",      symbol: "ETH",  color: "#12AAFF" },
  421614:   { name: "Arb Sepolia",   symbol: "ETH",  color: "#12AAFF", testnet: true },
  137:      { name: "Polygon",       symbol: "MATIC", color: "#8247E5" },
  80002:    { name: "Amoy",          symbol: "MATIC", color: "#8247E5", testnet: true },
};

export const FAUCET_URLS: Record<number, string> = {
  11155111: "https://sepoliafaucet.com",
  84532:    "https://faucet.base.org",
  11155420: "https://app.optimism.io/faucet",
  421614:   "https://faucet.quicknode.com/arbitrum/sepolia",
  80002:    "https://faucet.polygon.technology",
};
