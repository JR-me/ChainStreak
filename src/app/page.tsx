"use client";

import { useState, useEffect } from "react";
import { useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { useChainstreak, TIER_COLOR, TIER_NAME, TIER_THRESHOLD, type Tier } from "@/hooks/useChainstreak";
import { CHAIN_META, FAUCET_URLS } from "@/lib/wagmi";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS: { id: Tier; label: string; range: string; color: string; bg: string; border: string }[] = [
  { id: 0, label: "WHITE",  range: "0–9 days",   color: "#64748b", bg: "#f8fafc", border: "#cbd5e1" },
  { id: 1, label: "BLUE",   range: "10–49 days",  color: "#2563eb", bg: "#eff6ff", border: "#93c5fd" },
  { id: 2, label: "SILVER", range: "50–99 days",  color: "#475569", bg: "#f1f5f9", border: "#94a3b8" },
  { id: 3, label: "GOLD",   range: "100+ days",   color: "#b45309", bg: "#fffbeb", border: "#fcd34d" },
];

// Accent palette — vivid sky blue as the base, tier color on top
const SKY  = "#0ea5e9";
const SKY2 = "#38bdf8";
const SKY3 = "#e0f2fe";
const INK  = "#0c1a2e";
const MIST = "#94a3b8";

// ─── Sub-components ───────────────────────────────────────────────────────────

function NftCard({
  isMinted, tier, tierColor,
  highestStreak, currentStreak, totalActiveDays, tokenId,
}: {
  isMinted: boolean; tier: Tier; tierColor: string;
  highestStreak: number; currentStreak: number;
  totalActiveDays: number; tokenId: bigint;
}) {
  const accentColor = isMinted ? tierColor : SKY;
  const tierCfg = TIERS[tier];

  return (
    <div style={{
      background: "#ffffff",
      border: `1.5px solid ${isMinted ? tierCfg.border : "#bae6fd"}`,
      borderRadius: 24, padding: "2rem 1.5rem",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem",
      aspectRatio: "1", position: "relative", overflow: "hidden",
      boxShadow: `0 4px 32px ${accentColor}22`,
      transition: "box-shadow .6s, border-color .6s",
    }}>
      {/* Soft glow behind the ring */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at 50% 42%, ${accentColor}14 0%, transparent 68%)`,
        pointerEvents: "none",
      }} />

      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3,
        color: isMinted ? accentColor : MIST, textTransform: "uppercase",
      }}>
        {isMinted ? `Chainstreak · #${tokenId}` : "Chainstreak NFT"}
      </p>

      {/* Ring */}
      <div style={{
        width: 128, height: 128, borderRadius: "50%",
        border: `2.5px solid ${accentColor}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        position: "relative",
        background: `${accentColor}08`,
        transition: "border-color .6s",
      }}>
        {isMinted && (
          <div style={{
            position: "absolute", inset: -12, borderRadius: "50%",
            border: `1.5px solid ${accentColor}30`,
            animation: "pulse 2.4s ease-in-out infinite",
          }} />
        )}
        {isMinted && (
          <div style={{
            position: "absolute", inset: -22, borderRadius: "50%",
            border: `1px solid ${accentColor}14`,
            animation: "pulse 2.4s ease-in-out infinite 0.8s",
          }} />
        )}
        <span style={{
          fontFamily: "'Syne',sans-serif", fontSize: 46, fontWeight: 800,
          color: accentColor, lineHeight: 1,
        }}>{highestStreak}</span>
        <span style={{
          fontFamily: "'Space Mono',monospace", fontSize: 7,
          letterSpacing: 2, color: `${accentColor}88`,
        }}>BEST STREAK</span>
      </div>

      <p style={{
        fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800,
        letterSpacing: 6, color: accentColor,
      }}>{TIER_NAME[tier]}</p>

      {isMinted && (
        <p style={{
          fontFamily: "'Space Mono',monospace", fontSize: 9,
          color: MIST, textAlign: "center",
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
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: 14, padding: "0.85rem 1rem",
      transition: "border-color .4s",
    }}>
      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 8,
        letterSpacing: 2, color: MIST, textTransform: "uppercase", marginBottom: 6,
      }}>{label}</p>
      <p style={{
        fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color,
      }}>{value}</p>
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
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (isConfirmed) {
      setCelebrating(true);
      setTimeout(() => { resetWrite(); setCelebrating(false); }, 3000);
    }
  }, [isConfirmed, resetWrite]);

  useEffect(() => {
    const handler = () => { setShowChains(false); setShowWallets(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const chainMeta = CHAIN_META[chainId];
  const faucetUrl = FAUCET_URLS[chainId];
  const accentColor = isMinted ? tierColor : SKY;

  const btnLabel = () => {
    if (isTxPending)                 return "Confirm in wallet…";
    if (isConfirming)                return "Waiting for block…";
    if (isConfirmed || celebrating)  return "✓ Checked in!";
    if (hasCheckedInToday)           return "Come back tomorrow ↗";
    if (!isMinted)                   return "✦ Mint & Check In";
    return "✦ Check In";
  };

  const btnDisabled = (hasCheckedInToday && !celebrating) || isTxPending || isConfirming || isConfirmed || celebrating;

  // SSR shell — keeps React hydration intact on Netlify / GitHub Pages
  if (!mounted) return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #f0f9ff; }
        body { background: #f0f9ff; color: ${INK}; font-family: 'Space Mono', monospace; min-height: 100vh; }
      `}</style>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(240,249,255,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #bae6fd",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.25rem", height: 56,
      }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: 4, color: SKY }}>CHAINSTREAK</span>
      </header>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 1.25rem 4rem" }} />
    </>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { background: #f0f9ff; }
        body { background: #f0f9ff; color: ${INK}; font-family: 'Space Mono', monospace; min-height: 100vh; }
        button { cursor: pointer; font-family: inherit; }

        @keyframes pulse {
          0%,100% { transform: scale(1); opacity: .2; }
          50%      { transform: scale(1.07); opacity: .5; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .fadein   { animation: fadein 0.3s ease forwards; }
        .dropdown { animation: fadein 0.12s ease forwards; }

        .checkin-btn {
          transition: transform .15s, box-shadow .2s;
        }
        .checkin-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px ${SKY}44;
        }
        .checkin-btn:not(:disabled):active {
          transform: translateY(0);
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 2px; }

        @media (max-width: 560px) {
          .grid-2      { grid-template-columns: 1fr !important; }
          .tiers-grid  { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(240,249,255,0.85)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #bae6fd",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", height: 56,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${SKY} 0%, ${SKY2} 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1 L7 13 M2 4 L7 1 L12 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: 14, letterSpacing: 3, color: accentColor,
            transition: "color .5s",
          }}>CHAINSTREAK</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {/* Chain switcher */}
          {isConnected && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowChains(v => !v); setShowWallets(false); }}
                style={{
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: 8, color: "#64748b",
                  fontSize: 10, padding: "5px 11px", letterSpacing: 0.5,
                  boxShadow: "0 1px 4px #0001",
                }}
              >
                {chainMeta ? `${chainMeta.name}${chainMeta.testnet ? " ·test" : ""}` : `Chain ${chainId}`}
              </button>
              {showChains && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: 12, padding: 6, minWidth: 175, zIndex: 200,
                  boxShadow: "0 8px 24px #0ea5e922",
                }}>
                  {chains.map(c => (
                    <button key={c.id}
                      onClick={() => { switchChain({ chainId: c.id }); setShowChains(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: c.id === chainId ? SKY3 : "transparent",
                        border: "none", padding: "7px 11px", borderRadius: 7,
                        fontSize: 10, letterSpacing: 0.3,
                        color: c.id === chainId ? SKY : "#64748b",
                        fontWeight: c.id === chainId ? 700 : 400,
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
                  background: SKY, border: "none",
                  borderRadius: 8, color: "#ffffff",
                  fontSize: 11, padding: "7px 16px", letterSpacing: 0.5,
                  fontWeight: 700, boxShadow: `0 2px 10px ${SKY}55`,
                }}>
                Connect wallet
              </button>
              {showWallets && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#ffffff", border: "1px solid #e2e8f0",
                  borderRadius: 12, padding: 6, minWidth: 185, zIndex: 200,
                  boxShadow: "0 8px 24px #0ea5e922",
                }}>
                  {connectors.map(c => (
                    <button key={c.id}
                      onClick={() => { connect({ connector: c }); setShowWallets(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none",
                        padding: "8px 11px", borderRadius: 7,
                        fontSize: 11, color: "#475569", letterSpacing: 0.3,
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
                background: "#ffffff", border: "1px solid #e2e8f0",
                borderRadius: 8, color: "#94a3b8",
                fontSize: 10, padding: "6px 12px", letterSpacing: 0.5,
                boxShadow: "0 1px 4px #0001",
              }}>
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 1.25rem 5rem" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "3rem 0 2.5rem" }}>
          {/* Decorative dot grid */}
          <div style={{
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            width: 320, height: 120, marginTop: -20,
            backgroundImage: `radial-gradient(circle, ${SKY}22 1.5px, transparent 1.5px)`,
            backgroundSize: "22px 22px",
            pointerEvents: "none",
          }} />
          <div style={{
            display: "inline-block",
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}30`,
            borderRadius: 99, padding: "4px 14px", marginBottom: "1rem",
          }}>
            <span style={{ fontSize: 10, letterSpacing: 2, color: accentColor, fontFamily: "'Space Mono',monospace" }}>
              ON-CHAIN STREAK TRACKER
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: "clamp(2.2rem, 8vw, 3.6rem)",
            color: INK, letterSpacing: -1.5, lineHeight: 1.05,
          }}>
            Daily proof<br />
            <span style={{ color: accentColor, transition: "color .5s" }}>of presence.</span>
          </h1>
          <p style={{ marginTop: "1rem", fontSize: 12, color: MIST, letterSpacing: 1.2, lineHeight: 1.8 }}>
            Check in once a day · Build your streak · Evolve your NFT
          </p>
        </div>

        {/* Tier pills */}
        <div className="tiers-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 8, marginBottom: "1.5rem",
        }}>
          {TIERS.map(t => {
            const active = isMinted && t.id === tier;
            return (
              <div key={t.id} style={{
                background: active ? t.bg : "#ffffff",
                border: `1.5px solid ${active ? t.border : "#e2e8f0"}`,
                borderRadius: 12, padding: "10px 8px", textAlign: "center",
                transition: "all .4s",
                boxShadow: active ? `0 2px 12px ${t.color}22` : "none",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: t.color, margin: "0 auto 6px",
                  boxShadow: active ? `0 0 6px ${t.color}88` : "none",
                }} />
                <p style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
                  color: active ? t.color : "#94a3b8",
                }}>{t.label}</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1", marginTop: 2 }}>
                  {t.range}
                </p>
              </div>
            );
          })}
        </div>

        {/* NFT card + stats */}
        <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
          <NftCard
            isMinted={isMinted} tier={tier} tierColor={tierColor}
            highestStreak={highestStreak} currentStreak={currentStreak}
            totalActiveDays={totalActiveDays} tokenId={tokenId}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Stat label="Current Streak" value={isMinted ? `${currentStreak} days` : "—"} color={accentColor} />
            <Stat label="Best Streak"    value={isMinted ? `${highestStreak} days` : "—"} color={accentColor} />
            <Stat label="Total Active"   value={isMinted ? `${totalActiveDays} days` : "—"} color={accentColor} />
            <Stat label="First Check-In" value={firstDate ?? "—"} color={MIST} />
          </div>
        </div>

        {/* Action area */}
        {!isConnected ? (
          <button
            onClick={() => setShowWallets(true)}
            className="checkin-btn"
            style={{
              width: "100%", padding: "1.1rem",
              background: SKY, border: "none",
              borderRadius: 14, color: "#ffffff",
              fontFamily: "'Syne',sans-serif", fontWeight: 700,
              fontSize: 14, letterSpacing: 3,
              boxShadow: `0 4px 20px ${SKY}55`,
            }}>
            Connect Wallet to Begin
          </button>

        ) : !contractAddress ? (
          <div style={{
            width: "100%", padding: "1.1rem", textAlign: "center",
            background: "#fffbeb", border: "1px solid #fcd34d",
            borderRadius: 14,
          }}>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "#b45309", letterSpacing: 1 }}>
              ⚠ No contract deployed on this network yet
            </p>
            <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "#d97706", marginTop: 6 }}>
              Switch to a supported chain using the dropdown above
            </p>
          </div>

        ) : (
          <>
            <button
              onClick={checkIn}
              disabled={btnDisabled}
              className="checkin-btn"
              style={{
                width: "100%", padding: "1.1rem",
                background: btnDisabled
                  ? "#f1f5f9"
                  : celebrating || isConfirmed
                    ? "#10b981"
                    : accentColor,
                border: "none",
                borderRadius: 14,
                color: btnDisabled && !celebrating && !isConfirmed ? MIST : "#ffffff",
                fontFamily: "'Syne',sans-serif", fontWeight: 700,
                fontSize: 14, letterSpacing: 3,
                transition: "background .3s, box-shadow .3s",
                boxShadow: btnDisabled ? "none"
                  : celebrating || isConfirmed ? "0 4px 20px #10b98155"
                  : `0 4px 20px ${accentColor}55`,
              }}>
              {btnLabel()}
            </button>

            {writeError && (
              <p className="fadein" style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#ef4444", textAlign: "center",
              }}>
                {writeError.message.slice(0, 100)}
              </p>
            )}

            {(isConfirmed || celebrating) && (
              <p className="fadein" style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#10b981", textAlign: "center", letterSpacing: 1,
              }}>
                ✓ Check-in confirmed on chain
              </p>
            )}

            {hasCheckedInToday && !celebrating && !isConfirmed && (
              <p style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: MIST, textAlign: "center", letterSpacing: 1,
              }}>
                Already checked in today. See you tomorrow.
              </p>
            )}

            {/* Tier progress */}
            {isMinted && (
              <div style={{ marginTop: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1", letterSpacing: 1 }}>
                    TIER PROGRESS
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: accentColor, fontWeight: 700 }}>
                    {tier < 3
                      ? `${highestStreak} / ${TIER_THRESHOLD[tier + 1]} days to ${TIER_NAME[(tier + 1) as Tier]}`
                      : "MAX TIER ✦"}
                  </span>
                </div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                    width: `${tierProgress}%`,
                    transition: "width .8s cubic-bezier(.4,0,.2,1)",
                    borderRadius: 3,
                  }} />
                </div>
              </div>
            )}

            {/* Faucet link */}
            {faucetUrl && (
              <p style={{ marginTop: "1rem", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1" }}>
                Need testnet gas?{" "}
                <a href={faucetUrl} target="_blank" rel="noreferrer" style={{ color: SKY, textDecoration: "none", borderBottom: `1px solid ${SKY}44` }}>
                  {CHAIN_META[chainId]?.name} faucet ↗
                </a>
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: "4.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1", letterSpacing: 1, lineHeight: 2.2 }}>
            Soul-bound ERC-721 · On-chain SVG · No IPFS · EVM multi-chain<br />
            Tier based on all-time highest streak — never decreases
          </p>
        </div>
      </main>
    </>
  );
}
