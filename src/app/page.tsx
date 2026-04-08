"use client";

import { useState, useEffect } from "react";
import { useConnect, useDisconnect, useSwitchChain, useChainId } from "wagmi";
import { useChainstreak, TIER_COLOR, TIER_NAME, TIER_THRESHOLD, type Tier } from "@/hooks/useChainstreak";
import { CHAIN_META, FAUCET_URLS } from "@/lib/wagmi";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS: { id: Tier; label: string; range: string; accent: string; glow: string; bg: string; border: string }[] = [
  { id: 0, label: "WHITE",  range: "0–9 days",   accent: "#64748b", glow: "#94a3b844", bg: "#f8fafc", border: "#cbd5e1" },
  { id: 1, label: "BLUE",   range: "10–49 days",  accent: "#0ea5e9", glow: "#0ea5e944", bg: "#f0f9ff", border: "#7dd3fc" },
  { id: 2, label: "SILVER", range: "50–99 days",  accent: "#64748b", glow: "#94a3b844", bg: "#f1f5f9", border: "#94a3b8" },
  { id: 3, label: "GOLD",   range: "100+ days",   accent: "#d97706", glow: "#f59e0b44", bg: "#fffbeb", border: "#fbbf24" },
];

const SKY   = "#0ea5e9";
const SKY_D = "#0284c7";
const INK   = "#0c1a2e";
const SLATE = "#64748b";
const MIST  = "#94a3b8";
const ICE   = "#f0f9ff";

// ─── Sub-components ───────────────────────────────────────────────────────────

function NftCard({
  isMinted, tier, tierColor,
  highestStreak, currentStreak, totalActiveDays, tokenId,
}: {
  isMinted: boolean; tier: Tier; tierColor: string;
  highestStreak: number; currentStreak: number;
  totalActiveDays: number; tokenId: bigint;
}) {
  const cfg    = TIERS[tier];
  const accent = isMinted ? cfg.accent : SKY;
  const border = isMinted ? cfg.border : "#7dd3fc";

  return (
    <div style={{
      background: "#ffffff",
      border: `2px solid ${border}`,
      borderRadius: 28,
      padding: "2rem 1.5rem",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1.1rem",
      aspectRatio: "1", position: "relative", overflow: "hidden",
      boxShadow: `0 0 0 6px ${accent}0a, 0 8px 40px ${accent}22`,
      transition: "box-shadow .6s, border-color .6s",
    }}>
      {/* Corner accent lines */}
      <div style={{ position: "absolute", top: 16, left: 16, width: 20, height: 20,
        borderTop: `2px solid ${accent}55`, borderLeft: `2px solid ${accent}55`, borderRadius: "4px 0 0 0" }} />
      <div style={{ position: "absolute", top: 16, right: 16, width: 20, height: 20,
        borderTop: `2px solid ${accent}55`, borderRight: `2px solid ${accent}55`, borderRadius: "0 4px 0 0" }} />
      <div style={{ position: "absolute", bottom: 16, left: 16, width: 20, height: 20,
        borderBottom: `2px solid ${accent}55`, borderLeft: `2px solid ${accent}55`, borderRadius: "0 0 0 4px" }} />
      <div style={{ position: "absolute", bottom: 16, right: 16, width: 20, height: 20,
        borderBottom: `2px solid ${accent}55`, borderRight: `2px solid ${accent}55`, borderRadius: "0 0 4px 0" }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 50% 44%, ${accent}10 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 3,
        color: isMinted ? `${accent}cc` : MIST, textTransform: "uppercase",
        zIndex: 1,
      }}>
        {isMinted ? `Chainstreak · #${tokenId}` : "Chainstreak NFT"}
      </p>

      {/* Orbit ring */}
      <div style={{
        width: 136, height: 136, borderRadius: "50%",
        border: `2px solid ${accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1,
      }}>
        {/* Inner glow disc */}
        <div style={{
          position: "absolute", inset: 8, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
        }} />

        {/* Main ring */}
        <div style={{
          width: 112, height: 112, borderRadius: "50%",
          border: `2.5px solid ${accent}`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          position: "relative",
          background: `${accent}06`,
        }}>
          {isMinted && <>
            <div style={{
              position: "absolute", inset: -14, borderRadius: "50%",
              border: `1.5px solid ${accent}35`,
              animation: "spin-ring 12s linear infinite",
              borderTopColor: "transparent", borderRightColor: "transparent",
            }} />
            <div style={{
              position: "absolute", inset: -22, borderRadius: "50%",
              border: `1px solid ${accent}18`,
              animation: "pulse 3s ease-in-out infinite",
            }} />
          </>}

          <span style={{
            fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 800,
            color: accent, lineHeight: 1,
          }}>{highestStreak}</span>
          <span style={{
            fontFamily: "'Space Mono',monospace", fontSize: 7,
            letterSpacing: 2, color: `${accent}88`,
          }}>BEST</span>
        </div>
      </div>

      {/* Tier badge */}
      <div style={{
        background: isMinted ? `${accent}12` : "#f1f5f9",
        border: `1px solid ${isMinted ? `${accent}30` : "#e2e8f0"}`,
        borderRadius: 99, padding: "4px 14px",
      }}>
        <p style={{
          fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800,
          letterSpacing: 5, color: isMinted ? accent : MIST,
        }}>{TIER_NAME[tier]}</p>
      </div>

      {isMinted && (
        <p style={{
          fontFamily: "'Space Mono',monospace", fontSize: 9,
          color: MIST, textAlign: "center", zIndex: 1,
          lineHeight: 1.7,
        }}>
          {currentStreak}d current · {totalActiveDays}d total
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, color, highlight }: { label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? `${color}08` : "#ffffff",
      border: `1.5px solid ${highlight ? `${color}30` : "#f1f5f9"}`,
      borderRadius: 16, padding: "0.9rem 1.1rem",
      transition: "all .4s",
      boxShadow: highlight ? `0 2px 16px ${color}18` : "none",
    }}>
      <p style={{
        fontFamily: "'Space Mono',monospace", fontSize: 8,
        letterSpacing: 2, color: MIST, textTransform: "uppercase", marginBottom: 6,
      }}>{label}</p>
      <p style={{
        fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800,
        color, lineHeight: 1,
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
    isTxPending, isConfirming, isConfirmed,
    writeError, checkIn, resetWrite,
  } = useChainstreak();

  const [showChains, setShowChains]   = useState(false);
  const [showWallets, setShowWallets] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [mounted, setMounted]         = useState(false);
  const [tick, setTick]               = useState(0); // drives live countdown

  useEffect(() => { setMounted(true); }, []);

  // Live clock tick — updates the "next check-in" countdown every second
  useEffect(() => {
    if (!isMinted || !hasCheckedInToday) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isMinted, hasCheckedInToday]);

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

  const chainMeta  = CHAIN_META[chainId];
  const faucetUrl  = FAUCET_URLS[chainId];
  const tierCfg    = TIERS[tier];
  const accent     = isMinted ? tierCfg.accent : SKY;

  // Live countdown to next UTC midnight
  const msUntilMidnight = (() => {
    const now   = Date.now();
    const midnight = (Math.floor(now / 86_400_000) + 1) * 86_400_000;
    return Math.max(0, midnight - now);
  })();
  const hh = String(Math.floor(msUntilMidnight / 3_600_000)).padStart(2, "0");
  const mm = String(Math.floor((msUntilMidnight % 3_600_000) / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((msUntilMidnight % 60_000) / 1000)).padStart(2, "0");

  const btnLabel = () => {
    if (isTxPending)                 return "Confirm in wallet…";
    if (isConfirming)                return "Waiting for block…";
    if (isConfirmed || celebrating)  return "✓ Checked in!";
    if (hasCheckedInToday)           return `Come back in ${hh}:${mm}:${ss}`;
    if (!isMinted)                   return "✦ Mint & Check In";
    return "✦ Check In";
  };

  const btnDisabled = (hasCheckedInToday && !celebrating) || isTxPending || isConfirming || isConfirmed || celebrating;
  const btnGreen    = isConfirmed || celebrating;

  // SSR shell
  if (!mounted) return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{background:${ICE};}
        body{background:${ICE};color:${INK};font-family:'Space Mono',monospace;min-height:100vh;}
      `}</style>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(240,249,255,0.9)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid #bae6fd",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", height: 58,
      }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: 4, color: SKY }}>CHAINSTREAK</span>
      </header>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "72px 1.25rem 4rem" }} />
    </>
  );

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{background:${ICE};}
        body{background:${ICE};color:${INK};font-family:'Space Mono',monospace;min-height:100vh;}
        button{cursor:pointer;font-family:inherit;}

        @keyframes pulse {
          0%,100%{transform:scale(1);opacity:.2}
          50%{transform:scale(1.08);opacity:.55}
        }
        @keyframes spin-ring {
          from{transform:rotate(0deg)}
          to{transform:rotate(360deg)}
        }
        @keyframes fadein {
          from{opacity:0;transform:translateY(5px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes float {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-6px)}
        }
        @keyframes bar-shine {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes celebrate {
          0%{transform:scale(1)}
          30%{transform:scale(1.04)}
          60%{transform:scale(.98)}
          100%{transform:scale(1)}
        }

        .fadein   { animation: fadein .3s ease forwards; }
        .dropdown { animation: fadein .12s ease forwards; }
        .floating { animation: float 4s ease-in-out infinite; }

        .checkin-btn {
          transition: transform .15s ease, box-shadow .2s ease, background .3s ease;
        }
        .checkin-btn:not(:disabled):hover {
          transform: translateY(-3px);
        }
        .checkin-btn:not(:disabled):active {
          transform: translateY(-1px) scale(.99);
        }
        .celebrate-anim { animation: celebrate .5s ease forwards; }

        /* Dot-grid background via CSS */
        .dot-bg {
          background-image: radial-gradient(circle, ${SKY}18 1.5px, transparent 1.5px);
          background-size: 28px 28px;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 2px; }

        @media (max-width: 600px) {
          .grid-2     { grid-template-columns: 1fr !important; }
          .tiers-grid { grid-template-columns: repeat(2,1fr) !important; }
          .hero-title { font-size: 2.2rem !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(240,249,255,0.88)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid #bae6fd",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", height: 58,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: `linear-gradient(135deg, ${SKY} 0%, #38bdf8 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 10px ${SKY}55`,
          }}>
            <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L7 13M2 4L7 1L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: 14, letterSpacing: 3,
            color: accent, transition: "color .5s",
          }}>CHAINSTREAK</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          {isConnected && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowChains(v => !v); setShowWallets(false); }}
                style={{
                  background: "#fff", border: "1.5px solid #e2e8f0",
                  borderRadius: 9, color: SLATE,
                  fontSize: 10, padding: "5px 12px", letterSpacing: 0.3,
                }}
              >
                {chainMeta ? `${chainMeta.name}${chainMeta.testnet ? " ·test" : ""}` : `Chain ${chainId}`}
              </button>
              {showChains && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#fff", border: "1.5px solid #e2e8f0",
                  borderRadius: 14, padding: 6, minWidth: 175, zIndex: 200,
                  boxShadow: `0 8px 32px ${SKY}22`,
                }}>
                  {chains.map(c => (
                    <button key={c.id}
                      onClick={() => { switchChain({ chainId: c.id }); setShowChains(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: c.id === chainId ? "#f0f9ff" : "transparent",
                        border: "none", padding: "7px 11px", borderRadius: 8,
                        fontSize: 10, color: c.id === chainId ? SKY : SLATE,
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

          {!isConnected ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowWallets(v => !v); setShowChains(false); }}
                style={{
                  background: SKY, border: "none",
                  borderRadius: 9, color: "#fff",
                  fontSize: 11, padding: "7px 18px", letterSpacing: 0.5,
                  fontWeight: 700, boxShadow: `0 3px 14px ${SKY}66`,
                  transition: "box-shadow .2s",
                }}>
                Connect wallet
              </button>
              {showWallets && (
                <div className="dropdown" style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  background: "#fff", border: "1.5px solid #e2e8f0",
                  borderRadius: 14, padding: 6, minWidth: 185, zIndex: 200,
                  boxShadow: `0 8px 32px ${SKY}22`,
                }}>
                  {connectors.map(c => (
                    <button key={c.id}
                      onClick={() => { connect({ connector: c }); setShowWallets(false); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none",
                        padding: "8px 11px", borderRadius: 8,
                        fontSize: 11, color: SLATE,
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
                background: "#fff", border: "1.5px solid #e2e8f0",
                borderRadius: 9, color: MIST,
                fontSize: 10, padding: "6px 12px",
              }}>
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "58px 1.25rem 5rem" }}>

        {/* Hero */}
        <div className="dot-bg" style={{
          textAlign: "center", padding: "3.5rem 1rem 2.5rem",
          borderRadius: 28, margin: "1.5rem 0",
          border: "1.5px solid #e0f2fe",
          background: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          {/* Top accent bar */}
          <div style={{
            position: "absolute", top: 0, left: "20%", right: "20%", height: 3,
            background: `linear-gradient(90deg, transparent, ${SKY}, transparent)`,
            borderRadius: "0 0 4px 4px",
          }} />

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: `${accent}12`, border: `1px solid ${accent}28`,
            borderRadius: 99, padding: "5px 14px", marginBottom: "1.2rem",
            transition: "background .5s, border-color .5s",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent, animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, letterSpacing: 2.5, color: accent, fontFamily: "'Space Mono',monospace", transition: "color .5s" }}>
              ON-CHAIN STREAK TRACKER
            </span>
          </div>

          <h1 className="hero-title floating" style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: "3.2rem",
            color: INK, letterSpacing: -2, lineHeight: 1.05,
          }}>
            Daily proof<br />
            <span style={{ color: accent, transition: "color .5s" }}>of presence.</span>
          </h1>

          <p style={{ marginTop: "1rem", fontSize: 11, color: MIST, letterSpacing: 1.5, lineHeight: 2 }}>
            Check in once a day · Build your streak · Evolve your NFT
          </p>

          {/* Streak badge if minted */}
          {isMinted && (
            <div className="fadein" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              marginTop: "1.5rem",
              background: `${accent}0e`, border: `1.5px solid ${accent}25`,
              borderRadius: 14, padding: "10px 20px",
            }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: accent, lineHeight: 1 }}>
                {currentStreak}
              </span>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: 2, color: `${accent}88` }}>DAY STREAK</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: MIST, marginTop: 2 }}>
                  {hasCheckedInToday ? `✓ checked in today` : "⚡ not checked in yet"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tier pills */}
        <div className="tiers-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 8, marginBottom: "1.25rem",
        }}>
          {TIERS.map(t => {
            const active = isMinted && t.id === tier;
            return (
              <div key={t.id} style={{
                background: active ? t.bg : "#fff",
                border: `1.5px solid ${active ? t.border : "#f1f5f9"}`,
                borderRadius: 14, padding: "12px 8px", textAlign: "center",
                transition: "all .4s",
                boxShadow: active ? `0 2px 16px ${t.glow}` : "0 1px 4px #0001",
              }}>
                <div style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: t.accent, margin: "0 auto 7px",
                  boxShadow: active ? `0 0 8px ${t.accent}bb` : "none",
                  transition: "box-shadow .4s",
                }} />
                <p style={{
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10,
                  color: active ? t.accent : MIST, letterSpacing: 1,
                }}>{t.label}</p>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1", marginTop: 3 }}>
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
            <Stat label="Current Streak" value={isMinted ? `${currentStreak} days` : "—"} color={accent} highlight={isMinted} />
            <Stat label="Best Streak"    value={isMinted ? `${highestStreak} days` : "—"} color={accent} highlight={isMinted} />
            <Stat label="Total Active"   value={isMinted ? `${totalActiveDays} days` : "—"} color={accent} />
            <Stat label="First Check-In" value={firstDate ?? "—"} color={SLATE} />
          </div>
        </div>

        {/* ── Action area ── */}
        {!isConnected ? (
          <button
            onClick={() => setShowWallets(true)}
            className="checkin-btn"
            style={{
              width: "100%", padding: "1.1rem",
              background: SKY, border: "none",
              borderRadius: 16, color: "#fff",
              fontFamily: "'Syne',sans-serif", fontWeight: 800,
              fontSize: 14, letterSpacing: 3,
              boxShadow: `0 4px 24px ${SKY}66`,
            }}>
            Connect Wallet to Begin
          </button>

        ) : !contractAddress ? (
          <div style={{
            width: "100%", padding: "1.1rem", textAlign: "center",
            background: "#fffbeb", border: "1.5px solid #fcd34d",
            borderRadius: 16,
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
              className={`checkin-btn${btnGreen ? " celebrate-anim" : ""}`}
              style={{
                width: "100%", padding: "1.1rem",
                background: btnDisabled && !btnGreen
                  ? "#f8fafc"
                  : btnGreen
                    ? "#10b981"
                    : accent,
                border: btnDisabled && !btnGreen ? "1.5px solid #e2e8f0" : "none",
                borderRadius: 16,
                color: btnDisabled && !btnGreen ? MIST : "#fff",
                fontFamily: "'Syne',sans-serif", fontWeight: 800,
                fontSize: 14, letterSpacing: 3,
                boxShadow: btnDisabled && !btnGreen ? "none"
                  : btnGreen ? "0 4px 24px #10b98166"
                  : `0 4px 24px ${accent}66`,
                transition: "background .3s, box-shadow .3s",
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

            {btnGreen && (
              <p className="fadein" style={{
                marginTop: 8, fontFamily: "'Space Mono',monospace",
                fontSize: 9, color: "#10b981", textAlign: "center", letterSpacing: 1,
              }}>
                ✓ Check-in confirmed on chain — streak updated!
              </p>
            )}

            {/* Countdown when already checked in */}
            {hasCheckedInToday && !celebrating && !isConfirmed && (
              <div className="fadein" style={{
                marginTop: 10, padding: "10px 16px",
                background: "#f8fafc", border: "1.5px solid #e2e8f0",
                borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: MIST, letterSpacing: 1 }}>
                  NEXT CHECK-IN IN
                </span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: SKY, letterSpacing: 2 }}>
                  {hh}:{mm}:{ss}
                </span>
              </div>
            )}

            {/* Tier progress */}
            {isMinted && (
              <div style={{ marginTop: "1.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: MIST, letterSpacing: 1 }}>
                    TIER PROGRESS
                  </span>
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: accent, fontWeight: 700 }}>
                    {tier < 3
                      ? `${highestStreak} / ${TIER_THRESHOLD[tier + 1]} days → ${TIER_NAME[(tier + 1) as Tier]}`
                      : "✦ MAX TIER"}
                  </span>
                </div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    height: "100%",
                    width: `${tierProgress}%`,
                    background: `linear-gradient(90deg, ${accent}99, ${accent})`,
                    borderRadius: 4,
                    transition: "width .9s cubic-bezier(.4,0,.2,1)",
                    position: "relative", overflow: "hidden",
                  }}>
                    {/* Shine sweep */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                      backgroundSize: "200% 100%",
                      animation: "bar-shine 2.5s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>
            )}

            {faucetUrl && (
              <p style={{ marginTop: "1.25rem", textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1" }}>
                Need testnet gas?{" "}
                <a href={faucetUrl} target="_blank" rel="noreferrer"
                  style={{ color: SKY, textDecoration: "none", borderBottom: `1px solid ${SKY}44` }}>
                  {CHAIN_META[chainId]?.name} faucet ↗
                </a>
              </p>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ marginTop: "4rem", borderTop: "1.5px solid #f0f9ff", paddingTop: "1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: "#cbd5e1", letterSpacing: 1, lineHeight: 2.4 }}>
            Soul-bound ERC-721 · On-chain SVG · No IPFS · EVM multi-chain<br />
            Tier based on all-time highest streak — never decreases
          </p>
        </div>
      </main>
    </>
  );
}
