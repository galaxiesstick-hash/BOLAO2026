import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ConquistasClient from "./ConquistasClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conquistas · Admin" };

export default async function ConquistasPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const defs = await db.achievementDefinition.findMany({
    orderBy: [{ criteriaKey: "asc" }, { level: "asc" }],
  });

  return <ConquistasClient initialDefs={defs} />;
}
