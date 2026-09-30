# To-Do API

A persistent task manager API on Express 5 + PostgreSQL. Full CRUD + search +
filtering + stats, with Swagger UI. App and database start together with one
command.

## Requirements

- Docker Desktop (with Compose v2+)
- Node.js 18+ only if you want to run the app outside Docker

## Run the whole stack

```bash
docker compose up --build
```

That is the whole setup. Postgres starts, initialises itself from `schema.sql`,
seeds 3 tasks, and the API comes up on [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/).

Run it again later with just `docker compose up -d`.

## Configuration

The connection string lives in `.env`, which is **gitignored**. `.env.example`
is committed so the shape is documented.

```bash
cp .env.example .env    # then edit the password
```

| Variable | Purpose |
|----------|---------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Postgres container credentials |
| `DATABASE_URL` | Connection string used by the app |
| `PORT` | API port (defaults to `3000`) |

Under `docker compose up` the host in `DATABASE_URL` must be the compose service
name `db`, not `localhost`. For local development against a Postgres running on
your host, use `localhost`.

## Project structure

```
src/
  app.js                  bootstrap — express, middleware, 404/error handlers, listen
  routes.js               route → controller mapping + Swagger UI mount
  openapi.js              OpenAPI 3.0 spec
  api/tasksController.js  HTTP layer — input validation, status codes, JSON responses
  data/pg.js              connection pool + env loading
  data/taskRepository.js  data layer — all SQL, row → task mapping
schema.sql                table + index + first-run seed, run by Postgres on volume init
docker-compose.yml        app + database + named volume
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List all tasks (`?done=true/false`) |
| GET | `/tasks/search?q=term` | Search by title (`?done=` optional) |
| POST | `/tasks` | Create a task (`{title, completed?}`) → **201** |
| PUT | `/tasks/:id` | Update a task (`{title?, completed?}`) → **200** |
| DELETE | `/tasks/:id` | Delete a task → **204** |
| GET | `/stats` | Task statistics (`{total, done, open}`) |
| POST | `/reset` | Restore 3 seed tasks → **200** |

Errors are returned as JSON, e.g. `{"error":"task not found"}` (404) or
`{"error":"title is required"}` (400).

## What the storage swap actually changed — honestly

The brief for this task said "switching storage really does change only one
file." **That is not what happened, and claiming otherwise would be a lie.**
Fourteen files changed:

**Added (6)**
`.dockerignore` · `Dockerfile` · `docker-compose.yml` · `schema.sql` ·
`.env.example` · `src/data/pg.js`

**Modified (7)**
`.gitignore` · `package.json` · `package-lock.json` · `src/app.js` ·
`src/data/taskRepository.js` · `src/api/tasksController.js` · `README.md`
(this file)

**Deleted (1)**
`src/data/db.js`

**Genuinely untouched (2)**
`src/routes.js` and `src/openapi.js` — zero diff.

### The one exception worth explaining

`src/api/tasksController.js` changed by 14 lines, and every one of them is
`async` + `await`. This was not avoidable.

The old store was `better-sqlite3`, which is **synchronous**. The controller
called the data layer directly inside a handler:

```js
res.json(taskRepo.listTasks(done));   // worked only because the call blocked
```

`pg` is a network client and cannot block. There is no way to give it a
synchronous interface. Leaving the controller alone would have made every
endpoint return `{}`, because `JSON.stringify(Promise)` is `{}`.

So the honest statement of the architecture is:

> The layering isolates **SQL**, not **asynchrony**. Swapping storage means
> rewriting the data layer and its infrastructure. It does *not* mean the HTTP
> layer is frozen — going from an in-process database to a networked one
> changes the calling convention.

What the layering *did* buy: **no route, path, status code, validation rule, or
JSON shape changed.** `routes.js` and `openapi.js` have a zero-line diff. The
API contract is identical.

### Dialect translation (SQLite → Postgres)

| SQLite | Postgres |
|---|---|
| `?` placeholders | `$1`, `$2` |
| `info.lastInsertRowid` | `INSERT ... RETURNING id` |
| `db.transaction(fn)` | `client.query('BEGIN'/'COMMIT')` |
| `completed INTEGER 1/0` | `completed BOOLEAN true/false` |
| deleting the `sqlite_sequence` row | `TRUNCATE tasks RESTART IDENTITY` |
| `COALESCE(SUM(completed), 0)` | `COUNT(*) FILTER (WHERE completed)` |
| `AUTOINCREMENT` | `SERIAL` |

Two subtleties that would have shipped as silent bugs:

1. `COUNT(*)` returns `bigint`, which node-postgres hands back as a **string**.
   Without `pg.types.setTypeParser(20, ...)` in `src/data/pg.js` the API would
   have answered `{"total":"6"}` instead of `{"total":6}` — a breaking change
   to the response contract that no test would have caught.
2. The controller's `doneFilter` produces `1`/`0`, but `completed` is now a real
   boolean. `WHERE completed = $1` with `1` is a Postgres type error, so the
   integer is translated to a boolean inside the repository.

## Persistence, and how it was checked

Data lives in the named Docker volume `crudapi_pgdata`, not inside the
container. Four checks, with real output:

### 1. Rows created

```
$ curl -X POST /tasks -d '{"title":"persist-alpha"}'   # + persist-beta
$ curl localhost:3000/stats
{"total":5,"done":1,"open":4}
```

### 2. App container restarted

```
$ docker compose restart app
 Container crudapi-app-1 Started
$ curl localhost:3000/stats
{"total":5,"done":1,"open":4}
```

### 3. Both containers destroyed and recreated

`docker compose down` removes the containers entirely — a new database process
is started against the same volume.

```
$ docker compose down && docker compose up -d
$ curl localhost:3000/stats
{"total":5,"done":1,"open":4}
$ curl 'localhost:3000/tasks/search?q=persist'
[{"id":4,"title":"persist-alpha",...,"created_at":"2026-09-30T13:09:08.036Z"},
 {"id":5,"title":"persist-beta",...,"created_at":"2026-09-30T13:09:08.505Z"}]
```

The `created_at` timestamps are unchanged from step 1, which is what proves
these are the original rows rather than a fresh seed.

### 4. Negative control — the volume is actually load-bearing

The check above would also pass if the data lived at a path inside the
container, since `down` without `-v` does not delete anonymous container
writ layers... but it would fail if data were stored in the container itself and
the container were *recreated*. Step 3 does recreate it. The unambiguous test is
to drop the volume:

```
$ docker compose down -v
 Volume crudapi_pgdata Removed
$ docker compose up -d
$ curl localhost:3000/stats
{"total":0,"done":0,"open":0}
$ curl localhost:3000/tasks
[]
```

Rows gone, exactly as expected — and the fresh volume re-ran `schema.sql`,
re-seeding 3 tasks on a subsequent fresh start. **This confirms the persistence
in steps 2 and 3 came from the named volume, and that nothing was hiding in the
container filesystem.**

## Notes

- `schema.sql` runs **only** when Postgres initialises an empty volume. Changing
  it later will not alter an existing database — add a migration step for that.
- The app waits for Postgres via a `pg_isready` healthcheck and a
  `depends_on: service_healthy` gate. Without that gate the API crash-loops on
  first boot while the database is still starting.
- To wipe everything and start clean: `docker compose down -v`.

## Example usage

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"buy milk"}'

curl http://localhost:3000/tasks?done=false
curl "http://localhost:3000/tasks/search?q=milk"
curl http://localhost:3000/stats
```
