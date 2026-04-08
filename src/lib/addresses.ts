/**
 * CHAINSTREAK CONTRACT ADDRESSES
 * ─────────────────────────────────────────────────────────────────────────────
 * After deploying via Remix, copy the contract address here for each network.
 * The app auto-selects based on the user's connected chain.
 *
 * Steps:
 *  1. Deploy Chainstreak.sol in Remix
 *  2. Copy the deployed address from the Remix "Deployed Contracts" panel
 *  3. Paste it below next to the matching chain ID
 *  4. Rebuild and redeploy the frontend
 */

export const CHAINSTREAK_ADDRESSES: Record<number, `0x${string}`> = {
  // ── Mainnets ────────────────────────────────────────────────────────────────
  1:      "0x0000000000000000000000000000000000000000", // Ethereum Mainnet
  8453:   "0x0000000000000000000000000000000000000000", // Base
  10:     "0x0000000000000000000000000000000000000000", // Optimism
  42161:  "0x0000000000000000000000000000000000000000", // Arbitrum One
  137:    "0x0000000000000000000000000000000000000000", // Polygon

  // ── Testnets ────────────────────────────────────────────────────────────────
  11155111: "0x7a7fccd8266b01e5c117ff4b0947405a0f98af20", // Ethereum Sepolia
  84532:    "0x0000000000000000000000000000000000000000", // Base Sepolia  ← start here
  11155420: "0x0000000000000000000000000000000000000000", // OP Sepolia
  421614:   "0x0000000000000000000000000000000000000000", // Arbitrum Sepolia
  80002:    "0x0000000000000000000000000000000000000000", // Polygon Amoy
};

/** Returns the contract address for a given chain, or null if not deployed there */
export function getContractAddress(chainId: number): `0x${string}` | null {
  const addr = CHAINSTREAK_ADDRESSES[chainId];
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return null;
  return addr;
}
