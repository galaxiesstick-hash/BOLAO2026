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
  const [scores, prizePoolAgg] = await Promise.all([
    db.userScore.findMany({
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
      where: { status: "APPROVED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const prizePool = prizePoolAgg._sum.amount ? Number(prizePoolAgg._sum.amount) : 0;
  const approvedCount = prizePoolAgg._count.id;

  const totalParticipants = scores.length;
  const divisions = calculateDivisions(totalParticipants);

  // Build ranking entries — compute overall rank from position in sorted list
  const entries: RankingEntry[] = scores.map((score, idx) => ({
    userId: score.user.id,
    userName: score.user.name,
    avatarUrl: score.user.avatarUrl ?? score.user.image ?? null,
    totalPoints: score.totalPoints,
    overallRank: score.overallRank ?? idx + 1,
    divisionRank: score.divisionRank,
    division: score.division,
    exactScores: score.exactScores,
    correctWinners: score.correctWinners,
    matchesBet: score.matchesBet,
  }));

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
