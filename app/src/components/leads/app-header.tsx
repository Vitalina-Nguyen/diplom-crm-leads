import Link from "next/link";
import { AppNavLink } from "@/components/leads/app-nav-link";
import { logoutAction } from "@/lib/actions/auth";
import { isAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { ru } from "@/messages/ru";

export async function AppHeader() {
  const showUsers = await isAdmin();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/leads" className="text-base font-semibold text-slate-900">
          {ru.nav.appName}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <AppNavLink href="/leads" activeMode="leads-list">
            {ru.nav.allLeads}
          </AppNavLink>
          <AppNavLink href="/leads/new">{ru.nav.newLead}</AppNavLink>
          {showUsers ? (
            <>
              <AppNavLink href="/users">{ru.nav.users}</AppNavLink>
              <AppNavLink href="/lead-sources">{ru.nav.leadSources}</AppNavLink>
              <AppNavLink href="/ingest-tokens">{ru.nav.ingestTokens}</AppNavLink>
            </>
          ) : null}
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" className="!px-2 !py-1 text-sm">
              {ru.nav.logout}
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
