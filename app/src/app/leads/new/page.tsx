import { prisma } from "@/lib/prisma";
import { NewLeadForm } from "./new-lead-form";

export default async function NewLeadPage() {
  const [sources, users] = await Promise.all([
    prisma.leadSource.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
  ]);

  return <NewLeadForm sources={sources} users={users} />;
}
