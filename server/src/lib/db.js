import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Render requires SSL
});

let retries = 0;

async function connectWithRetry() {
  try {
    await pool.query("SELECT 1"); // health check
    console.log("✅ Database connected successfully");
    retries = 0;
  } catch (err) {
    retries++;
    const delay = Math.min(1000 * retries, 30000); // exponential backoff
    console.error(`❌ DB connection failed (attempt ${retries}). Retrying in ${delay}ms`, err.code);
    setTimeout(connectWithRetry, delay);
  }
}

connectWithRetry();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});

export default pool;
