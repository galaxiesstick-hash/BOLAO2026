"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { Division } from "@/lib/divisions";
import { useIsOnline } from "@/components/presence/PresenceProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankingEntry = {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  badge?: string | null;
  totalPoints: number;
  matchPoints: number;
  questionPoints: number;
  achievementPoints: number;
  overallRank: number | null;
  divisionRank: number | null;
  division: string | null;
  exactScores: number;
  correctWinners: number;
  matchesBet: number;
  rankChange?: number | null;
  livePoints?: number;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarCircle({ entry, size = 36, color = "#3CAC3B" }: { entry: RankingEntry; size?: number; color?: string }) {
  const online = useIsOnline(entry.userId);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 99,
        background: `radial-gradient(circle at 30% 30%, ${color}cc, ${color}66)`,
        border: `2px solid ${color}`,
        boxShadow: online ? "0 0 0 3px #3CAC3B, 0 0 12px rgba(60,172,59,0.5)" : undefined,
        transition: "box-shadow 0.3s ease",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-bebas, Bebas Neue, sans-serif)",
        fontSize: size * 0.5, color: "#0a1628", fontWeight: 700,
        letterSpacing: 0.5, overflow: "hidden", flexShrink: 0,
      }}
    >
      {entry.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.avatarUrl} alt={entry.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        getInitials(entry.userName)
      )}
    </div>
  );
}

// ─── Podium card ──────────────────────────────────────────────────────────────

const PODIUM_STYLES = {
  gold:   { bg: "linear-gradient(180deg, rgba(201,168,76,0.22), rgba(201,168,76,0.05))", border: "rgba(201,168,76,0.45)", color: "#C9A84C", h: 145, crown: true },
  silver: { bg: "linear-gradient(180deg, rgba(220,220,235,0.15), rgba(220,220,235,0.03))", border: "rgba(220,220,235,0.3)", color: "#dcdcef", h: 120 },
  bronze: { bg: "linear-gradient(180deg, rgba(176,136,85,0.18), rgba(176,136,85,0.03))", border: "rgba(176,136,85,0.4)", color: "#b08855", h: 105 },
};

function PodiumCard({ entry, tone, center }: { entry: RankingEntry; tone: "gold" | "silver" | "bronze"; center?: boolean }) {
  const s = PODIUM_STYLES[tone];
  return (
    <div
      style={{
        borderRadius: 14, padding: "12px 6px 10px", textAlign: "center",
        position: "relative", background: s.bg,
        border: `1px solid ${s.border}`, height: s.h,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
      }}
    >
      {/* Crown (gold only) */}
      {tone === "gold" && (
        <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)" }}>
          <svg width="28" height="22" viewBox="0 0 28 22">
            <path d="M2 6l5 4 7-8 7 8 5-4-2 14H4L2 6z" fill="#C9A84C" stroke="#7a6628" strokeWidth="0.8" />
            <circle cx="7" cy="10" r="1.5" fill="#fff8d8" />
            <circle cx="14" cy="2" r="1.5" fill="#fff8d8" />
            <circle cx="21" cy="10" r="1.5" fill="#fff8d8" />
          </svg>
        </div>
      )}

      {/* Rank badge — top for silver/bronze, invisible spacer for gold (crown handles it) */}
      <div className="font-display" style={{ fontSize: 11, color: tone === "gold" ? "transparent" : "rgba(255,255,255,0.28)", letterSpacing: 0.8, lineHeight: 1 }}>
        #{entry.overallRank ?? "?"}
      </div>

      {/* Middle: avatar + name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
        <AvatarCircle entry={entry} size={center ? 48 : 38} color={s.color} />
        <div style={{ fontSize: 10, fontWeight: 700, color: "#f3f6fb", width: "100%", textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical" as const, WebkitLineClamp: 2, wordBreak: "break-word", lineHeight: 1.3 }}>
          {entry.userName.split(" ")[0]}
        </div>
      </div>

      {/* Points — bottom */}
      <div className="font-display" style={{ fontSize: center ? 18 : 14, color: s.color, lineHeight: 1, letterSpacing: 0.5 }}>
        {entry.totalPoints} pts
      </div>
    </div>
  );
}

// ─── Rank row ─────────────────────────────────────────────────────────────────

function ChangeBadge({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "2px 6px", borderRadius: 6,
        background: "rgba(60,172,59,0.14)", border: "1px solid rgba(60,172,59,0.3)",
        fontSize: 9.5, fontWeight: 700, color: "#3CAC3B", letterSpacing: 0.3,
      }}>
        ▲{change}
      </div>
    );
  }
  if (change < 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 2,
        padding: "2px 6px", borderRadius: 6,
        background: "rgba(230,29,37,0.12)", border: "1px solid rgba(230,29,37,0.3)",
        fontSize: 9.5, fontWeight: 700, color: "#E61D25", letterSpacing: 0.3,
      }}>
        ▼{Math.abs(change)}
      </div>
    );
  }
  return (
    <div style={{
      padding: "2px 6px", borderRadius: 6,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
      fontSize: 9.5, fontWeight: 700, color: "rgba(231,238,250,0.38)", letterSpacing: 0.3,
    }}>
      —
    </div>
  );
}

function RankRow({ entry, isMe, displayRank }: { entry: RankingEntry; isMe: boolean; displayRank: number }) {
  const inner = (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
        borderRadius: 12,
        background: isMe ? "rgba(60,172,59,0.14)" : "transparent",
        border: isMe ? "1px solid rgba(60,172,59,0.35)" : "1px solid transparent",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
    >
      <div className="font-display" style={{ width: 28, textAlign: "center", fontSize: 16, color: isMe ? "#3CAC3B" : "rgba(231,238,250,0.38)", letterSpacing: 0.4 }}>
        #{displayRank}
      </div>
      <AvatarCircle entry={entry} size={32} color={isMe ? "#3CAC3B" : "#1c2f4d"} />
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, overflow: "hidden" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.userName}
          </span>
          {isMe && <span style={{ fontSize: 10, color: "#3CAC3B", fontWeight: 400, flexShrink: 0 }}>(você)</span>}
          {entry.badge && (
            <span title={entry.badge} style={{ flexShrink: 0, fontSize: 14, lineHeight: 1, cursor: "default" }}>👑</span>
          )}
          {entry.livePoints != null && entry.livePoints > 0 && (
            <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 6, background: "rgba(230,29,37,0.14)", border: "1px solid rgba(230,29,37,0.35)", fontSize: 9, fontWeight: 800, color: "#E61D25", letterSpacing: 0.3 }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: "#E61D25", display: "inline-block" }} className="animate-lamp" />
              +{entry.livePoints} ao vivo
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: "rgba(231,238,250,0.45)" }}>
            ⚽ <span style={{ color: "rgba(231,238,250,0.7)", fontWeight: 600 }}>{entry.matchPoints}</span>
          </span>
          <span style={{ fontSize: 9, color: "rgba(231,238,250,0.25)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(231,238,250,0.45)" }}>
            ❓ <span style={{ color: "rgba(231,238,250,0.7)", fontWeight: 600 }}>{entry.questionPoints}</span>
          </span>
          <span style={{ fontSize: 9, color: "rgba(231,238,250,0.25)" }}>·</span>
          <span style={{ fontSize: 10, color: "rgba(201,168,76,0.7)" }}>
            🏅 <span style={{ color: "#C9A84C", fontWeight: 700 }}>{entry.achievementPoints}</span>
          </span>
        </div>
      </div>
      {entry.rankChange != null && <ChangeBadge change={entry.rankChange} />}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div className="font-display" style={{ fontSize: 17, color: "#f3f6fb", letterSpacing: 0.3 }}>
          {entry.totalPoints}
        </div>
        <div style={{ fontSize: 9, color: "rgba(231,238,250,0.35)", fontWeight: 600, letterSpacing: 0.3 }}>pts</div>
      </div>
    </div>
  );
  return <Link href={`/perfil/${entry.userId}`} style={{ textDecoration: "none", display: "block" }}>{inner}</Link>;
}

// ─── Prize pool banner ────────────────────────────────────────────────────────

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function PrizeBanner({ prizePool, approvedCount }: { prizePool: number; approvedCount: number }) {
  // Pot grows automatically as payments are approved. Split live: 1st place gets
  // 80% of the pot, 2nd place 20% (the prize for 3rd is a separate physical prize).
  const firstPlace = prizePool * 0.8;
  const secondPlace = prizePool * 0.2;
  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      background: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0.05) 100%)",
      border: "1px solid rgba(201,168,76,0.45)",
    }}>
      {/* Header */}
      <div style={{ padding: "10px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(201,168,76,0.75)", letterSpacing: 1.2, textTransform: "uppercase" }}>
              Pote do Bolão
            </div>
            <div className="font-display" style={{ fontSize: 20, color: "#C9A84C", marginTop: 1, letterSpacing: 0.4, lineHeight: 1.1 }}>
              {brl(prizePool)}
            </div>
          </div>
        </div>
        {approvedCount > 0 && (
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", textAlign: "right" }}>
            {approvedCount} lampar{approvedCount !== 1 ? "ões" : "ão"}<br />
            <span style={{ fontSize: 9 }}>na disputa</span>
          </div>
        )}
      </div>

      {/* Prize rows */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}>
        {[
          { pos: "1º", icon: "🥇", label: "Quem pontuar mais · 80%", value: brl(firstPlace),  color: "#C9A84C", bold: true  },
          { pos: "2º", icon: "🥈", label: "O vice-lamparão · 20%",  value: brl(secondPlace), color: "#dcdcef", bold: true  },
          { pos: "3º", icon: "🥉", label: "O menos pior",           value: "1 pote de chuvisco", color: "#b08855", bold: false },
        ].map((p, i, arr) => (
          <div key={p.pos} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 16px",
            borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: p.color, letterSpacing: 0.5 }}>{p.pos}</span>
              <span style={{ fontSize: 10.5, color: "rgba(231,238,250,0.5)", marginLeft: 6 }}>{p.label}</span>
            </div>
            <span className={p.bold ? "font-display" : ""} style={{ fontSize: p.bold ? 14 : 12, color: p.color, fontWeight: p.bold ? 700 : 600, letterSpacing: p.bold ? 0.3 : 0 }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Period = "geral" | "hoje" | "semana";

interface Props {
  entries: RankingEntry[];
  currentUserId: string;
  divisions: Division[];
  totalParticipants: number;
  prizePool?: number;
  approvedCount?: number;
  showPrizePool?: boolean;
  rankings?: { hoje: RankingEntry[]; semana: RankingEntry[] };
}

export default function RankingClient({ entries, currentUserId, divisions, totalParticipants, prizePool, approvedCount, showPrizePool = true, rankings }: Props) {
  const [search, setSearch] = useState("");
  const [activeDiv, setActiveDiv] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("geral");

  const isGeral = period === "geral";
  const sourceEntries = isGeral ? entries : (rankings?.[period] ?? []);

  const currentUserEntry = sourceEntries.find((e) => e.userId === currentUserId);

  const filtered = useMemo(() => {
    let result = sourceEntries;
    if (isGeral && activeDiv !== "all") result = result.filter((e) => e.division === activeDiv);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.userName.toLowerCase().includes(q));
    }
    return result;
  }, [sourceEntries, isGeral, activeDiv, search]);

  const top3 = sourceEntries.slice(0, 3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumTones: ("silver" | "gold" | "bronze")[] = ["silver", "gold", "bronze"];

  const periodTabs: { id: Period; label: string }[] = [
    { id: "geral", label: "Geral" },
    { id: "hoje", label: "Hoje" },
    { id: "semana", label: "Semana" },
  ];

  const divTabs = [
    { id: "all", label: "Geral", count: totalParticipants },
    ...divisions.map((d) => ({
      id: d.name,
      label: d.displayName.split(" - ")[0],
      count: d.size,
    })),
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex justify-between items-baseline">
        <span className="font-display leading-none tracking-wide" style={{ fontSize: 30, color: "#f3f6fb", letterSpacing: 0.4 }}>
          RANKING
        </span>
        <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 11, color: "rgba(231,238,250,0.38)" }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: "#C9A84C", display: "inline-block" }} />
          {totalParticipants} participantes
        </div>
      </div>

      {/* Period selector: Geral / Hoje / Semana */}
      {rankings && (
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {periodTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setPeriod(t.id)}
              className="flex-1 py-2 rounded-lg text-center transition-all"
              style={{
                background: period === t.id ? "#1c2f4d" : "transparent",
                border: period === t.id ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                fontSize: 12.5, fontWeight: 700,
                color: period === t.id ? "#f3f6fb" : "rgba(231,238,250,0.55)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Period note */}
      {!isGeral && (
        <div style={{ fontSize: 11, color: "rgba(231,238,250,0.5)", textAlign: "center" }}>
          {period === "hoje" ? "Pontos conquistados hoje" : "Pontos conquistados nos últimos 7 dias"}
        </div>
      )}

      {/* Prize pool (only on Geral; hidden via SHOW_PRIZE_POOL while pending payers settle) */}
      {isGeral && showPrizePool && prizePool != null && prizePool > 0 && (
        <PrizeBanner prizePool={prizePool} approvedCount={approvedCount ?? 0} />
      )}

      {/* Division tabs (scrollable — names can be long) — only on Geral */}
      {isGeral && divTabs.length > 1 && (
        <div style={{ overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ display: "flex", gap: 8, width: "max-content", paddingBottom: 4 }}>
            {divTabs.map((tab) => {
              const active = activeDiv === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDiv(tab.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                    background: active ? "#1c2f4d" : "#0f1d33",
                    border: active ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.07)",
                    fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
                    color: active ? "#f3f6fb" : "rgba(231,238,250,0.62)",
                  }}
                >
                  {tab.label}
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", padding: "1px 6px", borderRadius: 99, background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)" }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Podium (only on Geral overall view) */}
      {isGeral && activeDiv === "all" && !search && top3.length >= 1 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1.15fr 1fr", alignItems: "end" }}>
          {podiumOrder.map((entry, i) => entry && (
            <PodiumCard key={entry.userId} entry={entry} tone={podiumTones[i]} center={i === 1} />
          ))}
        </div>
      )}

      {/* My position card */}
      {currentUserEntry && (!isGeral || activeDiv !== "all" || (currentUserEntry.overallRank ?? 0) > 3 || search) && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(60,172,59,0.18) 0%, #0f1d33 65%)",
            border: "1px solid rgba(60,172,59,0.35)",
          }}
        >
          <AvatarCircle entry={currentUserEntry} size={44} color="#3CAC3B" />
          <div className="flex-1 min-w-0">
            <div className="font-bold uppercase tracking-wider" style={{ fontSize: 10.5, color: "#3CAC3B", letterSpacing: 0.6 }}>SUA POSIÇÃO</div>
            <div className="font-bold" style={{ fontSize: 14, color: "#f3f6fb", marginTop: 2 }}>{currentUserEntry.userName}</div>
          </div>
          <div className="text-right">
            <div className="font-display" style={{ fontSize: 28, color: "#f3f6fb", lineHeight: 1, letterSpacing: 0.4 }}>
              #{currentUserEntry.overallRank ?? "–"}
            </div>
            <div className="font-mono font-bold" style={{ fontSize: 13, color: "#C9A84C", marginTop: 4 }}>
              {currentUserEntry.totalPoints} pts
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 3 }}>
              <span style={{ fontSize: 10, color: "rgba(231,238,250,0.45)" }}>⚽ {currentUserEntry.matchPoints}</span>
              <span style={{ fontSize: 9, color: "rgba(231,238,250,0.25)" }}>·</span>
              <span style={{ fontSize: 10, color: "rgba(231,238,250,0.45)" }}>❓ {currentUserEntry.questionPoints}</span>
              <span style={{ fontSize: 9, color: "rgba(231,238,250,0.25)" }}>·</span>
              <span style={{ fontSize: 10, color: "#C9A84C" }}>🏅 {currentUserEntry.achievementPoints}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl"
        style={{ padding: "10px 12px", background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="rgba(231,238,250,0.38)" strokeWidth="1.8" />
          <path d="M20 20l-3-3" stroke="rgba(231,238,250,0.38)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Buscar participante…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: 12.5, color: search ? "#f3f6fb" : "rgba(231,238,250,0.38)" }}
        />
      </div>

      {/* Rank list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 rounded-2xl" style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 13, color: "rgba(231,238,250,0.38)" }}>
            {!isGeral && !search ? "Ninguém pontuou neste período ainda" : "Nenhum participante encontrado"}
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((entry, idx) => {
            const displayRank = (isGeral && activeDiv !== "all") ? idx + 1 : (entry.overallRank ?? idx + 1);
            const isMe = entry.userId === currentUserId;
            return (
              <RankRow key={entry.userId} entry={entry} isMe={isMe} displayRank={displayRank} />
            );
          })}
        </div>
      )}
    </div>
  );
}
