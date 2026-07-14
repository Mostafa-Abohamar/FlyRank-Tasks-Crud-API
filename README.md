

## A simple in-memory task manager built with Express. Full CRUD + filtering + stats, with Swagger UI for interactive testing.

## How to run

npm install
npm start

Open [http://localhost:3000/api-docs/](http://localhost:3000/api-docs/) for Swagger UI.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List all tasks (`?done=true` / `?search=keyword`) |
| POST | `/tasks` | Create a task (`{title, completed?}`) → **201** |
| PUT | `/tasks/:id` | Update a task → **200** |
| DELETE | `/tasks/:id` | Delete a task → **204** |
| GET | `/stats` | Task statistics (`{total, done, open}`) |
| POST | `/reset` | Restore 3 seed tasks → **200** |

## Example usage

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"buy milk"}'

curl http://localhost:3000/tasks?done=true
curl http://localhost:3000/stats
Mortality experiment
Restarting the server deletes all tasks. Data lives in a JavaScript array in memory, so it vanishes when the process stops — a database is needed for persistence.
