import Link from "next/link";
import { ru } from "@/messages/ru";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-slate-900">Страница не найдена</h1>
      <p className="text-sm text-slate-600">Запрошенный адрес не существует.</p>
      <Link href="/leads" className="text-sm font-medium text-blue-600 hover:underline">
        {ru.nav.allLeads}
      </Link>
    </div>
  );
}
