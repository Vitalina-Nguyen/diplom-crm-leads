/**
 * Загружает `.env` из корня репозитория и из `app/`, чтобы `seed` и Prisma CLI
 * видели те же POSTGRES_* / DATABASE_URL, что и docker-compose.
 */
import { config } from "dotenv";
import path from "path";

const prismaDir = __dirname;
const appDir = path.join(prismaDir, "..");
const rootDir = path.join(prismaDir, "..", "..");

config({ path: path.join(rootDir, ".env") });
config({ path: path.join(appDir, ".env.local"), override: true });
config({ path: path.join(appDir, ".env"), override: true });

if (!process.env.DATABASE_URL?.trim()) {
  const user = process.env.POSTGRES_USER ?? "crm";
  const password = process.env.POSTGRES_PASSWORD ?? "crm";
  const host =
    process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== "postgres"
      ? process.env.POSTGRES_HOST
      : "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DB ?? "crm";
  process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}
