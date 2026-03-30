import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { NewUserForm } from "./new-user-form";

export default async function NewUserPage() {
  await requireAdmin();
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <NewUserForm roles={roles} />
    </div>
  );
}
