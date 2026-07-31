# To-Do API

A persistent task manager API built with Express and SQLite. Full CRUD + search + filtering + stats, with Swagger UI for interactive testing.

## Requirements

- Node.js 18+ (better-sqlite3 is a native module; on Windows you may need Visual Studio Build Tools)

## How to run

```bash
npm install
npm start
```

Open [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/) for Swagger UI.

Data lives in `tasks.db` (auto-created, gitignored, seeded with 3 tasks on first run) and survives restarts.

## Project structure

```
src/
  app.js                  bootstrap — express, middleware, 404/error handlers, listen
  routes.js               route → controller mapping + Swagger UI mount
  openapi.js              OpenAPI 3.0 spec
  api/tasksController.js  HTTP layer — input validation, status codes, JSON responses
  data/db.js              SQLite connection, schema, migration, seed
  data/taskRepository.js  data layer — all SQL, row → task mapping
```

The API layer (`api/`) handles HTTP concerns; the data layer (`data/`) is HTTP-agnostic, so storage can be swapped without touching routes.

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

Errors are returned as JSON, e.g. `{"error":"task not found"}` (404) or `{"error":"title is required"}` (400).

## Example usage

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"buy milk"}'

curl http://localhost:3000/tasks?done=false
curl "http://localhost:3000/tasks/search?q=milk"
curl http://localhost:3000/stats
```
