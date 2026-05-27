import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PerguntasClient from "./PerguntasClient";

export const dynamic = "force-dynamic";

export default async function PerguntasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const questions = await db.question.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      answers: {
        where: { userId: session.user.id },
        select: { answer: true, correct: true, points: true },
      },
      _count: { select: { answers: true } },
    },
  });

  return <PerguntasClient questions={questions} />;
}
