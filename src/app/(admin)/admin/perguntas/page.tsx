import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import PerguntasClient from "./PerguntasClient";

export const dynamic = "force-dynamic";

export default async function AdminPerguntasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const questions = await db.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      match: { select: { homeTeamName: true, awayTeamName: true, kickoff: true } },
      _count: { select: { answers: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perguntas Bônus</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Crie e gerencie perguntas para pontuação extra
        </p>
      </div>
      <PerguntasClient questions={questions} />
    </div>
  );
}
