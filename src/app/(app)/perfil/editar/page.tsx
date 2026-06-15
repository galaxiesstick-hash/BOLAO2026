import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import EditarPerfilClient from "./EditarPerfilClient";

export const dynamic = "force-dynamic";

export default async function EditarPerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatarUrl: true },
  });

  if (!user) redirect("/perfil");

  return (
    <EditarPerfilClient
      initialName={user.name}
      initialEmail={user.email}
      initialAvatarUrl={user.avatarUrl}
    />
  );
}
