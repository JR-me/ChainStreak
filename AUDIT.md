# Chainstreak — Full Security & Bug Audit

## CONTRACT VULNERABILITIES

### 🔴 CRITICAL — tokenURI returns data for unowned tokenId
**File:** Chainstreak.sol line 136-185
**Issue:** `tokenURI(tokenId)` looks up `ownerOfToken[tokenId]` which returns
`address(0)` for any tokenId that was never minted. It then calls
`streakOf[address(0)]` which is an empty struct — it silently returns a valid
(but blank) SVG instead of reverting. ERC-721 standard requires revert on
invalid tokenId.
**Fix:** Add existence check at top of tokenURI.

### 🔴 CRITICAL — _safeMint reentrancy window
**File:** Chainstreak.sol line 73-85
**Issue:** `_safeMint` calls `onERC721Received` on the recipient if it's a
contract. This callback fires BEFORE `data.tokenId` is written in storage
(the write happens at line 76-81 AFTER `_safeMint`). A malicious contract
could re-enter `checkIn()` during `onERC721Received`, see `data.tokenId == 0`
as still true, and mint a second NFT to a different address or drain state.
**Fix:** Write all state BEFORE calling `_safeMint` (checks-effects-interactions).

### 🟡 MEDIUM — `approve` and `setApprovalForAll` not blocked
**File:** Chainstreak.sol lines 189-195
**Issue:** `transferFrom` and `safeTransferFrom` are blocked, but `approve()`
and `setApprovalForAll()` are inherited from ERC721 and still callable.
Users can approve operators on a soul-bound token, creating misleading UX
and potentially allowing marketplace listings that will always fail at transfer.
**Fix:** Override both to revert.

### 🟡 MEDIUM — No check for contract wallets calling checkIn
**Issue:** A smart contract wallet could call `checkIn()`, get minted an NFT
via `_safeMint`, and if the contract doesn't implement `onERC721Received`
it would revert. This is handled by `_safeMint` itself, but it could brick
early adopters using multisigs without ERC721 receiver support.
**Fix:** Document clearly; optionally use `_mint` instead of `_safeMint` since
the NFT is soul-bound and cannot be transferred anyway.

### 🟡 MEDIUM — timestamp manipulation by validators
**Issue:** `block.timestamp` can be nudged ~15 seconds by validators on PoS
chains. Near UTC midnight, this could allow a check-in to count for the "wrong"
day. Low severity but worth noting.
**No fix possible** at contract level — inherent limitation of on-chain time.
Document as known limitation.

### 🟢 LOW — `glowColor` computed but never used in SVG
**File:** line 143 (`string memory glowColor = _tierGlow(tier)`)
**Issue:** Variable assigned but never referenced in the SVG string.
Dead code — wastes a tiny amount of gas on every `tokenURI` call.
**Fix:** Remove the variable.

### 🟢 LOW — Custom base64 encoder (reinventing the wheel)
**Issue:** The hand-rolled base64 encoder in `_base64()` uses inline assembly.
It works but is harder to audit than using OpenZeppelin's `Base64` utility
which is battle-tested. The assembly reads 32 bytes at a time and masks to
24 bits — correct, but fragile to future Solidity/EVM changes.
**Fix:** Replace with `import "@openzeppelin/contracts/utils/Base64.sol"`.

### 🟢 INFO — `ownerOfToken` mapping is redundant
**Issue:** ERC721 already maintains `_ownerOf` internally. The custom
`ownerOfToken` mapping duplicates this and must be kept in sync manually.
If they ever diverge (e.g. through a bug) it causes inconsistency.
**Fix:** Replace with `ownerOf(tokenId)` from the ERC721 base class.

---

## GITHUB PAGES 404 — ROOT CAUSE

Next.js reads `basePath` from `next.config.js` at **build time**, not runtime.
The workflow passed `NEXT_PUBLIC_BASE_PATH` as an env var to the build step,
but `next.config.js` used `process.env.NEXT_PUBLIC_BASE_PATH` which is only
available at build time inside the config file — HOWEVER the `npm run build:github`
script hardcodes it in package.json as `NEXT_PUBLIC_BASE_PATH=/chainstreak next build`,
which SHOULD work... except GitHub Actions on Ubuntu uses a different shell
and the inline env var syntax in package.json (`VAR=value cmd`) is not portable
across all CI environments without `cross-env`.

**Secondary issue:** The workflow ALSO passes the env var in the step's `env:`
block, creating a conflict where two different values could be set.

**Fix:** Remove the env var approach entirely. Hardcode `basePath` directly
in `next.config.js` and use a separate `next.config.github.js` selected
by the build script. Simpler and guaranteed to work.
