import { AppHeader } from "@/components/leads/app-header";

/** Avoid Prisma at `next build` prerender — data loads only at request time. */
export const dynamic = "force-dynamic";

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
