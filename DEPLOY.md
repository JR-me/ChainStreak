# Chainstreak — Deployment Guide

## Overview

This is the static frontend for the Chainstreak dApp.  
It exports as pure HTML/JS — no server needed — and can be hosted on GitHub Pages or Netlify.

```
src/
├── app/
│   ├── layout.tsx       Root layout + font imports
│   ├── page.tsx         Main dApp UI
│   └── providers.tsx    wagmi + react-query setup
├── hooks/
│   └── useChainstreak.ts  All contract reads + writes
└── lib/
    ├── abi.ts           Contract ABI
    ├── addresses.ts     ← UPDATE THIS after Remix deploy
    └── wagmi.ts         Multi-chain config
```

---

## Step 1 — Deploy the contract via Remix

1. Open **https://remix.ethereum.org**
2. Create a new file `Chainstreak.sol` and paste the contract code
3. Go to **Solidity Compiler** tab:
   - Compiler: `0.8.20`
   - Enable optimization: ✓ (200 runs)
   - Compile
4. Go to **Deploy & Run** tab:
   - Environment: `Injected Provider - MetaMask`
   - Switch MetaMask to your target network (e.g. Base Sepolia)
   - Click **Deploy**
5. Copy the deployed address from **Deployed Contracts** panel

> Recommended testnet to start: **Base Sepolia**  
> Get gas: https://faucet.base.org

---

## Step 2 — Add the address to the frontend

Open `src/lib/addresses.ts` and paste your deployed address:

```ts
export const CHAINSTREAK_ADDRESSES: Record<number, `0x${string}`> = {
  84532: "0xYOUR_DEPLOYED_ADDRESS_HERE",   // Base Sepolia
  // add more chains here as you deploy
};
```

Chain IDs:
| Network | Chain ID |
|---|---|
| Base Sepolia | 84532 |
| OP Sepolia | 11155420 |
| Arb Sepolia | 421614 |
| Sepolia | 11155111 |
| Base | 8453 |
| Optimism | 10 |
| Arbitrum | 42161 |
| Polygon | 137 |
| Ethereum | 1 |

---

## Step 3a — Deploy to Netlify

### Option A: Netlify UI (no CLI needed)

1. Push this folder to a GitHub repository
2. Go to **https://app.netlify.com** → New site → Import from Git
3. Select your repo
4. Build settings are auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `out`
5. Click **Deploy site**

Every push to `main` auto-deploys. Done.

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --dir=out --prod
```

---

## Step 3b — Deploy to GitHub Pages

### One-time setup

1. Push this repo to GitHub
2. Go to repo **Settings → Pages**
3. Source: **GitHub Actions**
4. That's it — the workflow at `.github/workflows/deploy.yml` handles everything

### Important: set your repo name

If your repo is not called `chainstreak`, edit `.github/workflows/deploy.yml`:

```yaml
- name: Build static export
  run: npm run build:github
  env:
    NEXT_PUBLIC_BASE_PATH: /YOUR-REPO-NAME   # ← change this
```

Also update `package.json`:
```json
"build:github": "NEXT_PUBLIC_BASE_PATH=/YOUR-REPO-NAME next build"
```

### Manual deploy (without Actions)

```bash
npm run build:github          # builds to ./out/
touch out/.nojekyll           # required — prevents Jekyll processing
# Then push ./out to your gh-pages branch, or use gh-pages npm package:
npx gh-pages -d out
```

### Your GitHub Pages URL will be:
`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/`

---

## Running locally

```bash
npm install
npm run dev         # → http://localhost:3000
```

For a production build preview:
```bash
npm run build
npm start           # serves ./out on localhost:3000
```

---

## Deploying to multiple chains

Each chain needs its own Remix deployment:

1. Switch MetaMask to the new chain
2. In Remix, Deploy & Run → select that network → Deploy
3. Add the new address to `addresses.ts`
4. Commit and push — auto-deploys to both hosts

---

## Verifying the contract on block explorers

Remix can verify directly:

1. After deploying, go to the **Etherscan** plugin in Remix (Plugin Manager → search Etherscan)
2. Enter your API key from the relevant explorer
3. Click Verify

Or use the explorer directly:
- Flatten the contract first: Solidity Compiler → `...` menu → Flatten
- Go to the contract on the explorer → Verify & Publish
- Compiler: `v0.8.20`, Optimization: Yes (200 runs), License: MIT

Explorer links:
- Base Sepolia: https://sepolia.basescan.org
- OP Sepolia: https://sepolia-optimism.etherscan.io
- Arb Sepolia: https://sepolia.arbiscan.io
- Sepolia: https://sepolia.etherscan.io
