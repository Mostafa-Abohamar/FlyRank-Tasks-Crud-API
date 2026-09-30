import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
    );
}

// Return BIGINT (int8) columns as JS numbers instead of strings. `COUNT(*)`
// returns bigint, and without this the API would answer {"total":"3"} instead
// of {"total":3}, silently changing the response contract.
pg.types.setTypeParser(20, (value) => Number(value));

const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
    console.error("unexpected postgres pool error:", err.message);
});

export default pool;
