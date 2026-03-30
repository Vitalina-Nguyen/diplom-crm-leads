"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base = "text-slate-600 hover:text-slate-900";
const active =
  "text-slate-900 underline decoration-slate-900 decoration-2 underline-offset-4";

function pathActive(pathname: string, href: string, mode: "prefix" | "leads-list"): boolean {
  if (mode === "leads-list") {
    if (pathname === "/leads") return true;
    if (pathname.startsWith("/leads/new")) return false;
    return pathname.startsWith("/leads/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  href: string;
  children: React.ReactNode;
  activeMode?: "prefix" | "leads-list";
};

export function AppNavLink({ href, children, activeMode = "prefix" }: Props) {
  const pathname = usePathname();
  const isOn = pathActive(pathname, href, activeMode);
  return (
    <Link href={href} className={isOn ? `${base} ${active}` : base}>
      {children}
    </Link>
  );
}
