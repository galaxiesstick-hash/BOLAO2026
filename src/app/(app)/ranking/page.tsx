import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { calculateDivisions } from "@/lib/divisions";
import RankingClient, { RankingEntry } from "./_components/RankingClient";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all UserScore records with user data, ordered by points desc
  const [scores, prizePoolAgg, answerPointsRows] = await Promise.all([
    db.userScore.findMany({
      where: {
        user: {
          role: "PARTICIPANT",
          payment: { status: "APPROVED" },
        },
      },
      orderBy: { totalPoints: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
      },
    }),
    db.payment.aggregate({
      where: { status: "APPROVED", user: { role: "PARTICIPANT" } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.answer.groupBy({
      by: ["userId"],
      where: { points: { gt: 0 } },
      _sum: { points: true },
    }),
  ]);

  // Build a map of userId → question points
  const questionPtsMap = new Map<string, number>(
    answerPointsRows.map((r) => [r.userId, r._sum.points ?? 0])
  );

  const prizePool = prizePoolAgg._sum.amount ? Number(prizePoolAgg._sum.amount) : 0;
  const approvedCount = prizePoolAgg._count.id;

  const totalParticipants = approvedCount;
  const divisions = calculateDivisions(totalParticipants);

  // Build ranking entries — compute overall rank from position in sorted list
  const entries: RankingEntry[] = scores.map((score, idx) => {
    const questionPoints = questionPtsMap.get(score.user.id) ?? 0;
    const matchPoints = Math.max(0, score.totalPoints - questionPoints);
    return {
      userId: score.user.id,
      userName: score.user.name,
      avatarUrl: score.user.avatarUrl ?? score.user.image ?? null,
      totalPoints: score.totalPoints,
      matchPoints,
      questionPoints,
      overallRank: score.overallRank ?? idx + 1,
      divisionRank: score.divisionRank,
      division: score.division,
      exactScores: score.exactScores,
      correctWinners: score.correctWinners,
      matchesBet: score.matchesBet,
    };
  });

  return (
    <RankingClient
      entries={entries}
      currentUserId={session.user.id}
      divisions={divisions}
      totalParticipants={totalParticipants}
      prizePool={prizePool}
      approvedCount={approvedCount}
    />
  );
}
