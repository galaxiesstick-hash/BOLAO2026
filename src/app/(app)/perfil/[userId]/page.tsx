import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLivePointsByUser, getAccuracyBreakdown } from "@/lib/ranking";
import { getAchievementGroups } from "@/lib/achievements";
import { AchievementCard } from "@/components/AchievementCard";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import AccuracyBreakdownCard from "@/components/AccuracyBreakdownCard";
import OnlineAvatarRing from "@/components/presence/OnlineAvatarRing";
import PublicProfileTabs from "./_components/PublicProfileTabs";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId } = await params;

  // Viewing self is allowed here too — shows the same public profile everyone
  // else sees (the full own profile with settings stays at /perfil).

  const [target, targetScore, targetAchievements, totalParticipants, finishedBetCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId, role: "PARTICIPANT" },
      select: { id: true, name: true, avatarUrl: true, image: true, badge: true, createdAt: true },
    }),
    db.userScore.findUnique({ where: { userId } }),
    db.userAchievement.findMany({
      where: { userId },
      select: { type: true, level: true, pointsBonus: true },
    }),
    db.userScore.count({
      where: { user: { role: "PARTICIPANT", payment: { status: "APPROVED" } } },
    }),
    // Palpites em jogos já finalizados — base do aproveitamento
    db.prediction.count({ where: { userId, match: { status: "FINISHED" } } }),
  ]);

  if (!target) notFound();

  const livePoints = (await getLivePointsByUser()).get(userId) ?? 0;
  const accuracyBreakdown = await getAccuracyBreakdown(userId);
  // Achievement groups from the live config; public profile shows ONLY the
  // groups this participant has already unlocked (>=1 level), without the
  // progress bar — just the level reached.
  const achievementGroups = await getAchievementGroups();
  const unlockedTypes = new Set(targetAchievements.map((a) => a.type));
  const unlockedGroups = achievementGroups
    .map((group) => ({
      group,
      unlockedLevel: group.levels.reduce((lvl, l, i) => (unlockedTypes.has(l.type) ? i + 1 : lvl), 0),
    }))
    .filter((g) => g.unlockedLevel > 0);
  const totalPoints = (targetScore?.totalPoints ?? 0) + livePoints;
  const overallRank = targetScore?.overallRank ?? null;
  const exactScores = targetScore?.exactScores ?? 0;
  const correctWinners = targetScore?.correctWinners ?? 0;
  const matchesBet = targetScore?.matchesBet ?? 0;
  // Aproveitamento só conta jogos finalizados (não inclui palpites de jogos futuros).
  const pct = finishedBetCount > 0 ? Math.round((correctWinners / finishedBetCount) * 100) : 0;

  const firstName = target.name.split(" ")[0];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link href="/ranking" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(231,238,250,0.55)", textDecoration: "none" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="rgba(231,238,250,0.55)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Voltar ao ranking
      </Link>

      {/* Hero card */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(42,57,141,0.2) 0%, #15263f 55%, rgba(201,168,76,0.1) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="absolute pointer-events-none" style={{ top: -50, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(42,57,141,0.3), transparent 65%)" }} />

        <div className="flex gap-4 items-start relative">
          {/* Avatar */}
          <OnlineAvatarRing userId={userId}>
            <div style={{ width: 72, height: 72, borderRadius: 99, background: "conic-gradient(#2A398D 0deg, #C9A84C 180deg, #2A398D 360deg)", padding: 3, flexShrink: 0 }}>
              <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#0f1d33", padding: 3 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "radial-gradient(circle at 30% 30%, #2A398Dcc, #2A398D66)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {(target.avatarUrl ?? target.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(target.avatarUrl ?? target.image)!} alt={target.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="font-display" style={{ fontSize: 26, color: "#f3f6fb" }}>{getInitials(target.name)}</span>
                  )}
                </div>
              </div>
            </div>
          </OnlineAvatarRing>

          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f3f6fb", letterSpacing: -0.2 }}>{target.name}</div>
            {target.badge && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4, padding: "3px 9px", borderRadius: 8, background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.4)" }}>
                <span style={{ fontSize: 12 }}>👑</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.3 }}>{target.badge}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { v: String(totalPoints), l: livePoints > 0 ? `pontos · +${livePoints} ao vivo` : "pontos", c: "#C9A84C" },
            { v: overallRank ? `#${overallRank}` : "–", l: `de ${totalParticipants}`, c: "#f3f6fb" },
            { v: `${pct}%`, l: "aproveitamento", c: "#3CAC3B" },
          ].map((s, i) => (
            <div key={s.l} className="text-center" style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div className="font-display leading-none" style={{ fontSize: 22, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: String(matchesBet), l: "Palpitados", c: "#f3f6fb" },
          { v: String(exactScores), l: "Cravados", c: "#C9A84C" },
          { v: String(correctWinners), l: "Acertos", c: "#3CAC3B" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl py-4 px-2 text-center" style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="font-display leading-none" style={{ fontSize: 26, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Accuracy breakdown by type */}
      <AccuracyBreakdownCard counts={accuracyBreakdown} />

      {/* Conquistas — só as já obtidas (>=1 nível), sem barra de progresso */}
      {unlockedGroups.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm" style={{ color: "#f3f6fb" }}>Conquistas</span>
            <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>{targetAchievements.length} desbloqueadas</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {unlockedGroups.map(({ group, unlockedLevel }) => (
              <AchievementCard
                key={group.key}
                group={group}
                unlockedLevel={unlockedLevel}
                showProgress={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tabs: Palpitados / Perguntas */}
      <PublicProfileTabs userId={userId} firstName={firstName} />
    </div>
  );
}
