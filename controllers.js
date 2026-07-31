import db from "./db.js";

const toTask = (row) => ({ ...row, completed: !!row.completed });

const toBool = (value) => value === true || value === 1 || value === "true" || value === "1";

const parseId = (raw) => {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const doneFilter = (done) => {
    if (done === undefined || done === "") return null;
    if (done === "true" || done === "1") return 1;
    if (done === "false" || done === "0") return 0;
    return undefined;
};

const escapeLike = (term) => term.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const getTasks = (req, res) => {
    const done = doneFilter(req.query.done);
    if (done === undefined) return res.status(400).json({ error: "done must be true or false" });
    const rows = done === null
        ? db.prepare("SELECT * FROM tasks").all()
        : db.prepare("SELECT * FROM tasks WHERE completed = ?").all(done);
    res.json(rows.map(toTask));
};

export const searchTasks = (req, res) => {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "q is required" });
    const done = doneFilter(req.query.done);
    if (done === undefined) return res.status(400).json({ error: "done must be true or false" });
    const pattern = `%${escapeLike(q)}%`;
    const rows = done === null
        ? db.prepare("SELECT * FROM tasks WHERE lower(title) LIKE lower(?) ESCAPE '\\'").all(pattern)
        : db.prepare("SELECT * FROM tasks WHERE lower(title) LIKE lower(?) ESCAPE '\\' AND completed = ?").all(pattern, done);
    res.json(rows.map(toTask));
};

export const createTask = (req, res) => {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : req.body.title;
    if (!title) return res.status(400).json({ error: "title is required" });
    const now = new Date().toISOString();
    const info = db.prepare("INSERT INTO tasks (title, completed, created_at, updated_at) VALUES (?, ?, ?, ?)")
        .run(title, toBool(req.body.completed) ? 1 : 0, now, now);
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(info.lastInsertRowid));
    res.status(201).json(toTask(row));
};

export const updateTask = (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "id must be a positive integer" });
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ error: "task not found" });
    const { title, completed } = req.body;
    const sets = [];
    const params = [];
    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim()) return res.status(400).json({ error: "title cannot be empty" });
        sets.push("title = ?");
        params.push(title.trim());
    }
    if (completed !== undefined) {
        sets.push("completed = ?");
        params.push(toBool(completed) ? 1 : 0);
    }
    if (sets.length > 0) {
        sets.push("updated_at = ?");
        params.push(new Date().toISOString());
        params.push(id);
        db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    }
    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.json(toTask(updated));
};

export const deleteTask = (req, res) => {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ error: "id must be a positive integer" });
    const info = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    if (info.changes === 0) return res.status(404).json({ error: "task not found" });
    res.status(204).send();
};

export const getStats = (req, res) => {
    const { total, done } = db.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS done FROM tasks").get();
    res.json({ total, done, open: total - done });
};

export const resetTasks = (req, res) => {
    db.transaction(() => {
        db.exec("DELETE FROM tasks; DELETE FROM sqlite_sequence WHERE name = 'tasks';");
        const ts = new Date().toISOString();
        const seed = db.prepare("INSERT INTO tasks (title, completed, created_at, updated_at) VALUES (?, ?, ?, ?)");
        seed.run("buy groceries", 0, ts, ts);
        seed.run("learn express", 1, ts, ts);
        seed.run("write tests", 0, ts, ts);
    })();
    const rows = db.prepare("SELECT * FROM tasks").all();
    res.json(rows.map(toTask));
};
