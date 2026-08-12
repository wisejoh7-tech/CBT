// check-postgres.ts
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Debug: confirm env var exists and is a string
console.log("DATABASE_URL type:", typeof process.env.DATABASE_URL);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);

async function checkPg() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Fix your .env.");
    process.exit(1);
  }

  const client = new Client({
    connectionString: String(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false } // required for Render
  });

  try {
    await client.connect();
    console.log("✅ Postgres connection string works!");
    const res = await client.query("SELECT current_database();");
    console.log("Connected to database:", res.rows[0].current_database);
    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Postgres connection failed:", err.message || err);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkPg();
