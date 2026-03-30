import { AppHeader } from "@/components/leads/app-header";

export const dynamic = "force-dynamic";

export default function LeadSourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
