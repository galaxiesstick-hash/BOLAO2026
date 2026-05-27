"use client";

import { useState, useMemo } from "react";
import { getInitials } from "@/lib/utils";
import { Division } from "@/lib/divisions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankingEntry = {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  overallRank: number | null;
  divisionRank: number | null;
  division: string | null;
  exactScores: number;
  correctWinners: number;
  matchesBet: number;
  rankChange?: number | null;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AvatarCircle({ entry, size = 36, color = "#3CAC3B" }: { entry: RankingEntry; size?: number; color?: string }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: 99,
        background: `radial-gradient(circle at 30% 30%, ${color}cc, ${color}66)`,
        border: `2px solid ${color}`,
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
        borderRadius: 14, padding: "14px 8px 12px", textAlign: "center",
        position: "relative", background: s.bg,
        border: `1px solid ${s.border}`, height: s.h,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}
    >
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
      <AvatarCircle entry={entry} size={center ? 50 : 40} color={s.color} />
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb", marginTop: 8, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {entry.userName.split(" ")[0]}
      </div>
      <div className="font-display" style={{ fontSize: center ? 20 : 16, color: s.color, lineHeight: 1, marginTop: 4, letterSpacing: 0.5 }}>
        {entry.totalPoints} pts
      </div>
      <div className="font-display" style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", fontSize: 14, color: "rgba(255,255,255,0.18)", letterSpacing: 1 }}>
        #{entry.overallRank ?? "?"}
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
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
        borderRadius: 12,
        background: isMe ? "rgba(60,172,59,0.14)" : "transparent",
        border: isMe ? "1px solid rgba(60,172,59,0.35)" : "1px solid transparent",
      }}
    >
      <div className="font-display" style={{ width: 28, textAlign: "center", fontSize: 16, color: isMe ? "#3CAC3B" : "rgba(231,238,250,0.38)", letterSpacing: 0.4 }}>
        #{displayRank}
      </div>
      <AvatarCircle entry={entry} size={32} color={isMe ? "#3CAC3B" : "#1c2f4d"} />
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {entry.userName}
        {isMe && <span style={{ fontSize: 10, color: "#3CAC3B", fontWeight: 400, marginLeft: 4 }}>(você)</span>}
      </div>
      {entry.rankChange != null && <ChangeBadge change={entry.rankChange} />}
      <div className="font-display" style={{ fontSize: 17, color: "#f3f6fb", minWidth: 48, textAlign: "right", letterSpacing: 0.3 }}>
        {entry.totalPoints}
      </div>
    </div>
  );
}

// ─── Prize pool banner ────────────────────────────────────────────────────────

function PrizeBanner({ prizePool, approvedCount }: { prizePool: number; approvedCount: number }) {
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(prizePool);
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 16px", borderRadius: 18,
        background: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.06) 100%)",
        border: "1px solid rgba(201,168,76,0.45)",
      }}
    >
      <div style={{ fontSize: 30, lineHeight: 1 }}>🏆</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(201,168,76,0.75)", letterSpacing: 1.2, textTransform: "uppercase" }}>
          Pote do Bolão
        </div>
        <div className="font-display" style={{ fontSize: 28, color: "#C9A84C", lineHeight: 1.1, letterSpacing: 0.4 }}>
          {formatted}
        </div>
        {approvedCount > 0 && (
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>
            {approvedCount} participante{approvedCount !== 1 ? "s" : ""} inscrito{approvedCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 9, color: "rgba(231,238,250,0.38)", letterSpacing: 0.5, textTransform: "uppercase" }}>Prêmio</div>
        <div className="font-display" style={{ fontSize: 20, color: "#C9A84C", letterSpacing: 0.4 }}>
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(prizePool * 0.6)}
        </div>
        <div style={{ fontSize: 8.5, color: "rgba(231,238,250,0.28)" }}>60% ao 1º</div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  entries: RankingEntry[];
  currentUserId: string;
  divisions: Division[];
  totalParticipants: number;
  prizePool?: number;
  approvedCount?: number;
}

export default function RankingClient({ entries, currentUserId, divisions, totalParticipants, prizePool, approvedCount }: Props) {
  const [search, setSearch] = useState("");
  const [activeDiv, setActiveDiv] = useState<string>("all");

  const currentUserEntry = entries.find((e) => e.userId === currentUserId);

  const filtered = useMemo(() => {
    let result = entries;
    if (activeDiv !== "all") result = result.filter((e) => e.division === activeDiv);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.userName.toLowerCase().includes(q));
    }
    return result;
  }, [entries, activeDiv, search]);

  const top3 = entries.slice(0, 3);
  const rest = filtered.filter((e) => (e.overallRank ?? 0) > 3);

  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumTones: ("silver" | "gold" | "bronze")[] = ["silver", "gold", "bronze"];

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

      {/* Prize pool */}
      {prizePool != null && prizePool > 0 && (
        <PrizeBanner prizePool={prizePool} approvedCount={approvedCount ?? 0} />
      )}

      {/* Division tabs */}
      {divTabs.length > 1 && (
        <div
          className="flex gap-1 p-0.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {divTabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveDiv(tab.id)}
              className="flex-1 py-2 rounded-lg text-center transition-all"
              style={{
                background: activeDiv === tab.id ? "#1c2f4d" : "transparent",
                border: activeDiv === tab.id ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                fontSize: 12, fontWeight: 700,
                color: activeDiv === tab.id ? "#f3f6fb" : "rgba(231,238,250,0.62)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Podium (only on overall view) */}
      {activeDiv === "all" && !search && top3.length >= 1 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1.15fr 1fr", alignItems: "end" }}>
          {podiumOrder.map((entry, i) => entry && (
            <PodiumCard key={entry.userId} entry={entry} tone={podiumTones[i]} center={i === 1} />
          ))}
        </div>
      )}

      {/* My position card */}
      {currentUserEntry && (activeDiv !== "all" || (currentUserEntry.overallRank ?? 0) > 3 || search) && (
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
          <p style={{ fontSize: 13, color: "rgba(231,238,250,0.38)" }}>Nenhum participante encontrado</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filtered.map((entry, idx) => {
            const displayRank = activeDiv === "all" ? (entry.overallRank ?? idx + 1) : idx + 1;
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
