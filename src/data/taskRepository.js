import db from "./db.js";

const toTask = (row) => ({ ...row, completed: !!row.completed });

const escapeLike = (term) => term.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export const listTasks = (done) => {
    const rows = done === null
        ? db.prepare("SELECT * FROM tasks").all()
        : db.prepare("SELECT * FROM tasks WHERE completed = ?").all(done);
    return rows.map(toTask);
};

export const searchTasks = (q, done) => {
    const pattern = `%${escapeLike(q)}%`;
    const rows = done === null
        ? db.prepare("SELECT * FROM tasks WHERE lower(title) LIKE lower(?) ESCAPE '\\'").all(pattern)
        : db.prepare("SELECT * FROM tasks WHERE lower(title) LIKE lower(?) ESCAPE '\\' AND completed = ?").all(pattern, done);
    return rows.map(toTask);
};

export const getTaskById = (id) => {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return row ? toTask(row) : null;
};

export const createTask = ({ title, completed }) => {
    const now = new Date().toISOString();
    const info = db.prepare("INSERT INTO tasks (title, completed, created_at, updated_at) VALUES (?, ?, ?, ?)")
        .run(title, completed ? 1 : 0, now, now);
    return getTaskById(Number(info.lastInsertRowid));
};

export const updateTask = (id, { title, completed }) => {
    if (!getTaskById(id)) return null;
    const sets = [];
    const params = [];
    if (title !== undefined) {
        sets.push("title = ?");
        params.push(title);
    }
    if (completed !== undefined) {
        sets.push("completed = ?");
        params.push(completed ? 1 : 0);
    }
    if (sets.length > 0) {
        sets.push("updated_at = ?");
        params.push(new Date().toISOString(), id);
        db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    }
    return getTaskById(id);
};

export const deleteTask = (id) => db.prepare("DELETE FROM tasks WHERE id = ?").run(id).changes > 0;

export const getStats = () => {
    const { total, done } = db.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(completed), 0) AS done FROM tasks").get();
    return { total, done, open: total - done };
};

export const resetTasks = () => {
    db.transaction(() => {
        db.exec("DELETE FROM tasks; DELETE FROM sqlite_sequence WHERE name = 'tasks';");
        const ts = new Date().toISOString();
        const seed = db.prepare("INSERT INTO tasks (title, completed, created_at, updated_at) VALUES (?, ?, ?, ?)");
        seed.run("buy groceries", 0, ts, ts);
        seed.run("learn express", 1, ts, ts);
        seed.run("write tests", 0, ts, ts);
    })();
    return listTasks(null);
};
