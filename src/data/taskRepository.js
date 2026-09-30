import pool from "./pg.js";

// The HTTP layer hands us `done` as 1 | 0 | null (see doneFilter in
// api/tasksController.js). Postgres `completed` is a real BOOLEAN, so the
// integer filter has to be translated at this boundary -- the controller is
// deliberately left untouched.
const toDoneFlag = (done) =>
    done === 1 || done === "1" || done === true || done === "true";

const toTask = (row) => ({ ...row, completed: !!row.completed });

const escapeLike = (term) => term.replace(/[\\%_]/g, (ch) => `\\${ch}`);

const SEED_TITLES = ["buy groceries", "learn express", "write tests"];

export const listTasks = async (done) => {
    const { rows } = done === null
        ? await pool.query("SELECT * FROM tasks ORDER BY id")
        : await pool.query("SELECT * FROM tasks WHERE completed = $1 ORDER BY id", [toDoneFlag(done)]);
    return rows.map(toTask);
};

export const searchTasks = async (q, done) => {
    const pattern = `%${escapeLike(q)}%`;
    const { rows } = done === null
        ? await pool.query(
            "SELECT * FROM tasks WHERE lower(title) LIKE lower($1) ESCAPE '\\' ORDER BY id",
            [pattern]
        )
        : await pool.query(
            "SELECT * FROM tasks WHERE lower(title) LIKE lower($1) ESCAPE '\\' AND completed = $2 ORDER BY id",
            [pattern, toDoneFlag(done)]
        );
    return rows.map(toTask);
};

export const getTaskById = async (id) => {
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    return rows.length ? toTask(rows[0]) : null;
};

export const createTask = async ({ title, completed }) => {
    const { rows } = await pool.query(
        "INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *",
        [title, completed ?? false]
    );
    return toTask(rows[0]);
};

export const updateTask = async (id, { title, completed }) => {
    if (!(await getTaskById(id))) return null;

    const sets = [];
    const params = [];
    if (title !== undefined) {
        params.push(title);
        sets.push(`title = $${params.length}`);
    }
    if (completed !== undefined) {
        params.push(completed);
        sets.push(`completed = $${params.length}`);
    }
    if (sets.length === 0) return getTaskById(id);

    sets.push("updated_at = now()");
    params.push(id);
    await pool.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    return getTaskById(id);
};

export const deleteTask = async (id) => {
    const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return rowCount > 0;
};

export const getStats = async () => {
    // COUNT returns bigint -> comes back as a string unless cast to int.
    // SUM over a boolean column is impossible, so FILTER is used instead.
    const { rows } = await pool.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE completed)::int AS done
        FROM tasks
    `);
    const { total, done } = rows[0];
    return { total, done, open: total - done };
};

export const resetTasks = async () => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        // RESTART IDENTITY is the Postgres equivalent of deleting the
        // sqlite_sequence row that the old implementation relied on.
        await client.query("TRUNCATE tasks RESTART IDENTITY");
        for (const [i, title] of SEED_TITLES.entries()) {
            await client.query(
                "INSERT INTO tasks (title, completed) VALUES ($1, $2)",
                [title, i === 1]
            );
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
    return listTasks(null);
};
