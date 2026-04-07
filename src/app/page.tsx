"use client";

import { useState, useEffect } from "react";
import { useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { useChainstreak, TIER_COLOR, TIER_NAME, TIER_THRESHOLD, type Tier } from "@/hooks/useChainstreak";
import { CHAIN_META, FAUCET_URLS } from "@/lib/wagmi";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS: { id: Tier; label: string; range: string }[] = [
  { id: 0, label: "WHITE",  range: "0 – 9 days"   },
  { id: 1, label: "BLUE",   range: "10 – 49 days"  },
  { id: 2, label: "SILVER", range: "50 – 99 days"  },
  { id: 3, label: "GOLD",   range: "100+ days"     },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NftCard({
  isMinted, tier, tierColor,
  highestStreak, currentStreak, totalActiveDays, tokenId,
}: {
  isMinted: boolean; tier: Tier; tierColor: string;
  highestStreak: number; currentStreak: number;
  totalActiveDays: number; tokenId: bigint;
}) {
  const c = isMinted ? tierColor : "#222";
  return (
    <div style={{
      background: "#0e0e0e",
      border: `1px solid ${isMinted ? tierColor + "3a" : "#1c1c1c"}`,
      borderRadius: 20, padding: "2rem",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem",
      aspectRatio: "1", position: "relative", overflow: "hidden",
      transition: "border-color .6s",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 38%, ${isMinted ? tierColor : "#000"}18 0%, transparent 65%)`,
        transition: "background .6s", pointerEvents: "none",
      }} />

      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3,
        color: isMinted ? tierColor + "99" : "#2a2a2a", textTransform: "uppercase",
        transition: "color .6s",
      }}>
        {isMinted ? `Chainstreak · #${tokenId}` : "Chainstreak NFT"}
      </p>

      <div style={{
        width: 124, height: 124, borderRadius: "50%",
        border: `2px solid ${c}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative", transition: "border-color .6s",
      }}>
        {isMinted && (
          <div style={{
            position: "absolute", inset: -10, borderRadius: "50%",
            border: `1px solid ${tierColor}28`,
            animation: "pulse 2.4s ease-in-out infinite",
          }} />
        )}
        <span style={{
          fontFamily: "'Syne',sans-serif", fontSize: 42, fontWeight: 800,
          color: c, lineHeight: 1, transition: "color .6s",
        }}>{highestStreak}</span>
        <span style={{
          fontFamily: "'Space Mono',monospace", fontSize: 7,
          letterSpacing: 2, color: isMinted ? tierColor + "77" : "#1e1e1e",
          transition: "color .6s",
        }}>BEST STREAK</span>
      </div>

      <p style={{
        fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800,
        letterSpacing: 6, color: c, transition: "color .6s",
      }}>{TIER_NAME[tier]}</p>

      {isMinted && (
        <p style={{
          fontFamily: "'Space Mono',monospace", fontSize: 9,
          color: "#4a4a4a", textAlign: "center",
        }}>
          Current {currentStreak}d · Total {totalActiveDays}d
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid #181818",
      borderRadius: 12, padding: "0.9rem 1rem",
    }}>
      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 8,
        letterSpacing: 2, color: "#383838", textTransform: "uppercase", marginBottom: 8,
      }}>{label}</p>
      <p style={{ fontFamily: "'Syne',sans-serif", fontSize: 19, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Page() {
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChain } = useSwitchChain();
  const chainId = useChainId();

  const {
    address, isConnected, contractAddress,
    isMinted, hasCheckedInToday,
    tokenId, firstDate,
    currentStreak, highestStreak, totalActiveDays,
    tier, tierColor, tierProgress,
    isStreakLoading, isTxPending, isConfirming, isConfirmed,
    writeError, checkIn, resetWrite,
  } = useChainstreak();

  const [showChains, setShowChains]   = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  // Locks the button label to "✓ Checked in!" for the full 3s, preventing
  // hasCheckedInToday (set by refetchStreak) from overwriting it early.
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isConfirmed) {
      setCelebrating(true);
      setTimeout(() => { resetWrite(); setCelebrating(false); }, 3000);
    }
  }, [isConfirmed, resetWrite]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => { setShowChains(false); setShowWallets(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const chainMeta = CHAIN_META[chainId];
  const faucetUrl = FAUCET_URLS[chainId];

  const btnLabel = () => {
    if (isTxPending)                return "Confirm in wallet…";
    if (isConfirming)               return "Waiting for block…";
    if (isConfirmed || celebrating)  return "✓ Checked in!";
    if (hasCheckedInToday) return "Come back tomorrow ↗";
    if (!isMinted)         return "✦ Mint & Check In";
    return "✦ Check In";
  };

  const btnDisabled = (hasCheckedInToday && !celebrating) || isTxPending || isConfirming || isConfirmed || celebrating;

  // During SSR/static export, render a minimal shell so React can hydrate correctly.
  // Returning null causes a hydration mismatch → all buttons stay unresponsive on Netlify/GH Pages.
  if (!mounted) return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #080808; }
        body { background: #080808; color: #bbb; font-family: 'Space Mono', monospace; min-height: 100vh; }
      `}</style>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#08080890", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #141414",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem", height: 54,
      }}>
        <span style={{
          fontFamily: "'Syne',sans-serif", fontWeight: 800,
          fontSize: 14, letterSpacing: 4, color: "#E8E8E8",
        }}>CHAINSTREAK</span>
      </header>
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "72px 1.25rem 4rem" }} />
    </>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #080808; }
        body { background: #080808; color: #bbb; font-family: 'Space Mono', monospace; min-height: 100vh; }
        button { cursor: pointer; font-family: inherit; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:.18} 50%{transform:scale(1.06);opacity:.4} }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .fadein { animation: fadein 0.35s ease forwards; }
        .dropdown { animation: fadein 0.15s ease forwards; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; border-radius: 2px; }
        @media (max-width: 560px) {
          .grid-2 { grid-template-columns: 1fr !important; }
          .tiers-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "#08080890", backdropFilter: "blur(14px)",
        borderBottom: "1px solid #141414",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem", height: 54,
      }}>
        <span style={{
          fontFamily: "'Syne',sans-serif", fontWeight: 800,
          fontSize: 14, letterSpacing: 4, color: tierColor,
          transition: "color .6s",
        }}>CHAINSTREAK</span>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {/* Chain switcher */}
          {isConnected && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowChains(v => !v); setShowWallets(false); }}
                style={{
                  background: "#0e0e0e", border: "1px solid #1e1e1e",
                  borderRadius: 8, color: "#555",
                  fontSize: 9, padding: "5px 10px", letterSpacing: 1,
                }}
              >
                {chainMeta ? `${chainMeta.name}${chainMeta.testnet ? " ·test" : ""}` : `Chain ${chainId}`}
              </button>
              {showChains && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#0e0e0e", border: "1px solid #1e1e1e",
                  borderRadius: 10, padding: 6, minWidth: 170, zIndex: 200,
                }}>
                  {chains.map(c => (
                    <button key={c.id}
                      onClick={() => { switchChain({ chainId: c.id }); setShowChains(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: c.id === chainId ? "#161616" : "transparent",
                        border: "none", padding: "7px 10px", borderRadius: 6,
                        fontSize: 9, letterSpacing: 0.5,
                        color: c.id === chainId ? tierColor : "#555",
                      }}>
                      {CHAIN_META[c.id]?.name ?? c.name}
                      {CHAIN_META[c.id]?.testnet ? " (test)" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wallet button */}
          {!isConnected ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowWallets(v => !v); setShowChains(false); }}
                style={{
                  background: "#E8E8E808", border: "1px solid #E8E8E830",
                  borderRadius: 8, color: "#E8E8E8",
                  fontSize: 10, padding: "6px 14px", letterSpacing: 1,
                }}>
                Connect
              </button>
              {showWallets && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#0e0e0e", border: "1px solid #1e1e1e",
                  borderRadius: 10, padding: 6, minWidth: 180, zIndex: 200,
                }}>
                  {connectors.map(c => (
                    <button key={c.id}
                      onClick={() => { connect({ connector: c }); setShowWallets(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none",
                        padding: "8px 10px", borderRadius: 6,
                        fontSize: 10, color: "#777", letterSpacing: 0.5,
                      }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => disconnect()}
              style={{
                background: "transparent", border: "1px solid #181818",
                borderRadius: 8, color: "#383838",
                fontSize: 9, padding: "6px 12px", letterSpacing: 1,
              }}>
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "72px 1.25rem 4rem" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "2.5rem 0 2rem" }}>
          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: "clamp(2rem, 7vw, 3.4rem)",
            color: tierColor, letterSpacing: -1, lineHeight: 1.05,
            transition: "color .6s",
          }}>
            Daily proof<br />of presence.
          </h1>
          <p style={{ marginTop: "0.9rem", fontSize: 11, color: "#383838", letterSpacing: 1.5 }}>
            Check in once a day · Build your streak · Evolve your NFT
          </p>
        </div>

        {/* Tier pills */}
        <div className="tiers-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 8, marginBottom: "1.25rem",
        }}>
          {TIERS.map(t => {
            const active = isMinted && t.id === tier;
            const c = TIER_COLOR[t.id];
            return (
              <div key={t.id} style={{
                background: active ? c + "0e" : "#0a0a0a",
                border: `1px solid ${active ? c + "44" : "#161616"}`,
                borderRadius: 10, padding: "10px 8px", textAlign: "center",
                transition: "all .5s",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, margin: "0 auto 6px" }} />
                <p style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
                  color: active ? c : "#2a2a2a",
                }}>{t.label}</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#2a2a2a", marginTop: 2 }}>
                  {t.range}
                </p>
              </div>
            );
          })}
        </div>

        {/* NFT card + stats */}
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <NftCard
            isMinted={isMinted} tier={tier} tierColor={tierColor}
            highestStreak={highestStreak} currentStreak={currentStreak}
            totalActiveDays={totalActiveDays} tokenId={tokenId}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Stat label="Current Streak" value={isMinted ? `${currentStreak} days` : "—"} color={tierColor} />
            <Stat label="Best Streak"    value={isMinted ? `${highestStreak} days` : "—"} color={tierColor} />
            <Stat label="Total Active"   value={isMinted ? `${totalActiveDays} days` : "—"} color={tierColor} />
            <Stat label="First Check-In" value={firstDate ?? "—"} color="#444" />
          </div>
        </div>

        {/* Action area */}
        {!isConnected ? (
          <button
            onClick={() => setShowWallets(true)}
            style={{
              width: "100%", padding: "1rem",
              background: "#E8E8E808", border: "1px solid #E8E8E824",
              borderRadius: 12, color: "#E8E8E8",
              fontFamily: "'Syne',sans-serif", fontWeight: 700,
              fontSize: 13, letterSpacing: 3,
            }}>
            Connect Wallet to Begin
          </button>

        ) : !contractAddress ? (
          <div style={{
            width: "100%", padding: "1rem", textAlign: "center",
            background: "#1a0d00", border: "1px solid #ff980033",
            borderRadius: 12,
          }}>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#ff9800", letterSpacing: 1 }}>
              ⚠ No contract deployed on this network yet
            </p>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#5a3a00", marginTop: 6 }}>
              Switch to a supported chain using the dropdown above
            </p>
          </div>

        ) : (
          <>
            <button
              onClick={checkIn}
              disabled={btnDisabled}
              style={{
                width: "100%", padding: "1rem",
                background: btnDisabled ? "#0a0a0a" : tierColor + "12",
                border: `1px solid ${btnDisabled ? "#161616" : tierColor + "55"}`,
                borderRadius: 12,
                color: btnDisabled ? "#2a2a2a" : tierColor,
                fontFamily: "'Syne',sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: 3, transition: "all .3s",
              }}>
              {btnLabel()}
            </button>

            {writeError && (
              <p className="fadein" style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#c0392b", textAlign: "center",
              }}>
                {writeError.message.slice(0, 100)}
              </p>
            )}

            {isConfirmed && (
              <p className="fadein" style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#27ae60", textAlign: "center",
              }}>
                ✓ Check-in confirmed on chain
              </p>
            )}

            {hasCheckedInToday && !isConfirmed && (
              <p style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#2e2e2e", textAlign: "center", letterSpacing: 1,
              }}>
                Already checked in today. See you tomorrow.
              </p>
            )}

            {/* Tier progress */}
            {isMinted && (
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#282828", letterSpacing: 1 }}>
                    TIER PROGRESS
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: tierColor }}>
                    {tier < 3 ? `${highestStreak} / ${TIER_THRESHOLD[tier + 1]} days to ${TIER_NAME[(tier + 1) as Tier]}` : "MAX TIER"}
                  </span>
                </div>
                <div style={{ height: 2, background: "#111", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: tierColor,
                    width: `${tierProgress}%`,
                    transition: "width .7s ease, background .6s ease",
                    borderRadius: 1,
                  }} />
                </div>
              </div>
            )}

            {/* Faucet link for testnets */}
            {faucetUrl && (
              <p style={{ marginTop: "1rem", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#282828" }}>
                Need testnet gas?{" "}
                <a href={faucetUrl} target="_blank" rel="noreferrer" style={{ color: "#3a3a3a", textDecoration: "underline" }}>
                  {CHAIN_META[chainId]?.name} faucet ↗
                </a>
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: "4rem", borderTop: "1px solid #111", paddingTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#1e1e1e", letterSpacing: 1, lineHeight: 2 }}>
            Soul-bound ERC-721 · On-chain SVG · No IPFS · EVM multi-chain<br />
            Tier based on all-time highest streak — never decreases
          </p>
        </div>
      </main>
    </>
  );
}
