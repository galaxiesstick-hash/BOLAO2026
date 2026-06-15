import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PerguntasClient from "./PerguntasClient";

export const dynamic = "force-dynamic";

export default async function PerguntasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <PerguntasClient />;
}
