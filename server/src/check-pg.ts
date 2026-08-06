
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function checkPg() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("✅ Postgres connection string works!");
    const res = await client.query("SELECT current_database();");
    console.log("Connected to database:", res.rows[0].current_database);
    await client.end();
  } catch (err: any) {
    console.error("❌ Postgres connection failed:", err.message);
    if (err.message && err.message.includes("database \"cbt_db\" does not exist")) {
        console.log("💡 You need to create the 'cbt_db' database.");
    }
  }
  process.exit();
}

checkPg();
