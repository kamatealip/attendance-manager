# Attendance Manager

A Next.js attendance-management application with PostgreSQL persistence.

## Stack

- Next.js 16 / React 19
- PostgreSQL
- `postgres` Node.js client
- Tailwind CSS
- Lucide icons

## Database setup

Create a PostgreSQL database named `attendance_manager` (or use an existing database) and set:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/attendance_manager
```

Copy `.env.example` to `.env.local` and fill in the connection string.

Apply the schema:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_initial.sql
```

Seed the default development class and roster:

```bash
psql "$DATABASE_URL" -f db/seed.sql
```

Check connectivity after starting the application:

```text
GET /api/health/db
```

A healthy database returns a JSON response with `status: "ok"` and `database: "connected"`.

## Attendance flow

The daily dashboard reads the roster and attendance records through server APIs. Attendance writes use PostgreSQL upserts keyed by student and attendance date, so changing a status updates the existing record instead of creating duplicates.

The history page also reads from PostgreSQL and provides student-level attendance summaries and CSV export.

## Development

```bash
npm install
npm run dev
```

Validation scripts currently available:

```bash
npm run lint
npm run build
```

## Database model

```text
classes
  └── students
        └── attendance_records
```

Attendance records are constrained to `present`, `absent`, or `late`, and each student can have at most one record per date.
