import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "../../tasks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
  )
`);

const columns = db.prepare("PRAGMA table_info(tasks)").all().map((c) => c.name);
if (!columns.includes("created_at")) db.exec("ALTER TABLE tasks ADD COLUMN created_at TEXT");
if (!columns.includes("updated_at")) db.exec("ALTER TABLE tasks ADD COLUMN updated_at TEXT");

const now = new Date().toISOString();
db.prepare("UPDATE tasks SET created_at = COALESCE(created_at, ?), updated_at = COALESCE(updated_at, ?) WHERE created_at IS NULL OR updated_at IS NULL").run(now, now);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) {
    const ts = new Date().toISOString();
    const seed = db.prepare("INSERT INTO tasks (title, completed, created_at, updated_at) VALUES (?, ?, ?, ?)");
    db.transaction(() => {
        seed.run("buy groceries", 0, ts, ts);
        seed.run("learn express", 1, ts, ts);
        seed.run("write tests", 0, ts, ts);
    })();
}

export default db;
