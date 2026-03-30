# CRM лидов (Next.js + Prisma + PostgreSQL)

Веб-приложение для учёта лидов: аутентификация, роли, источники, приём по API с токенами.

## Требования

- **Node.js** 20+ (рекомендуется LTS)
- **Docker** и Docker Compose — для локального PostgreSQL (или своя установка Postgres)

## Как поднять проект

### 1. Переменные окружения

В **корне репозитория** скопируйте пример и при необходимости поправьте значения:

```bash
cp .env.example .env
```

Файл задаёт пользователя, пароль, имя БД и порт для контейнера Postgres (см. `docker-compose.yml`).

В каталоге **`app/`** создайте файл **`app/.env`** (или `app/.env.local`) со строкой подключения к БД **с вашей машины** (не имя сервиса `postgres`, а `localhost` и тот же порт, что в `POSTGRES_PORT`):

```env
DATABASE_URL="postgresql://crm:crm@localhost:5432/crm"
```

Замените `crm` / `crm` / `crm` / порт, если меняли их в корневом `.env`. Пароль и пользователь должны совпадать с `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.

> Если `DATABASE_URL` в `app/.env` не задан, скрипт сида (`prisma/seed.ts` через `load-env.ts`) может собрать URL из переменных `POSTGRES_*` корневого `.env`. Команды **Prisma CLI** (`migrate`, `generate`) обычно читают в первую очередь `app/.env`, поэтому для миграций надёжнее явно указать `DATABASE_URL` в `app/`.

### 2. PostgreSQL в Docker

Из **корня репозитория**:

```bash
docker compose up -d
```

Дождитесь, пока сервис станет healthy (`pg_isready`). Данные тома: `storage/postgres/` (каталог в `.gitignore`).

### 3. Зависимости и Prisma Client

```bash
cd app
npm install
```

После установки выполнится `postinstall` → `prisma generate` (нужен корректный `DATABASE_URL` или среда, где generate не требует живой БД — generate сам по себе БД не трогает).

## Миграции

Все команды ниже выполняются из каталога **`app/`**, с настроенным **`app/.env`** (`DATABASE_URL`).

**Локальная разработка** — применить миграции и при необходимости открыть интерактив (имя новой миграции и т.д.):

```bash
npm run db:migrate
```

Это обёртка над `prisma migrate dev`.

**Только применить существующие миграции** (например, прод или CI, без интерактива):

```bash
npx prisma migrate deploy
```

## Сиды (начальные данные)

Из **`app/`**:

```bash
npm run db:seed
```

Скрипт: `app/prisma/seed.ts` (роли Admin/Member, пользователи, источники лидов, демо-лид). Перед сидом запускается `prisma generate`.

После сида для входа можно использовать **`admin@example.com`** / **`admin123`** (админ) и **`member@example.com`** / **`admin123`** (участник). В продакшене смените пароли.

## Запуск приложения

Из **`app/`**:

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Сборка продакшена:

```bash
npm run build
npm run start
```

## Частые проблемы

- **`P1000` / неверные учётные данные** при сиде: выровняйте `DATABASE_URL` в `app/.env` с реальными `POSTGRES_*` из корневого `.env` и перезапустите Postgres.
- **Windows, `EPERM` при `prisma generate`**: остановите `next dev` / `next start`, затем `npm run db:generate:clean` в `app/`.
- **Порт 5432 занят**: в корневом `.env` задайте другой `POSTGRES_PORT` и обновите `DATABASE_URL` в `app/.env`.

## Документация

- `docs/database-schema.md` — модель данных
- `docs/platform-use-cases.md` — сценарии
- `docs/logs/AI_CHANGELOG.md` — журнал изменений (для разработки)
