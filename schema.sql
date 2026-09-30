-- Schema for the tasks table.
-- Mounted into /docker-entrypoint-initdb.d by docker-compose.yml, so Postgres
-- runs this automatically the first time the volume is created.

CREATE TABLE IF NOT EXISTS tasks (
    id         SERIAL PRIMARY KEY,
    title      TEXT        NOT NULL,
    completed  BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- listTasks / searchTasks always read in insertion order.
CREATE INDEX IF NOT EXISTS tasks_completed_idx ON tasks (completed);

-- First-run seed. This file only executes when Postgres initialises a fresh,
-- empty volume, so these rows appear exactly once per volume -- the same
-- behaviour the old SQLite module had when it found an empty table.
INSERT INTO tasks (title, completed) VALUES
    ('buy groceries', false),
    ('learn express', true),
    ('write tests',   false);
