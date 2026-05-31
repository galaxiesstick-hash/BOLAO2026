import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MatchFilterTabs from "./_components/MatchFilterTabs";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <MatchFilterTabs />;
}
