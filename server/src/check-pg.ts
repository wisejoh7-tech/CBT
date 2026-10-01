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

    const dbRes = await client.query("SELECT current_database(), current_user, inet_server_addr(), inet_server_port();");
    const dbInfo = dbRes.rows[0];
    console.log("📊 Database Details:");
    console.log(`   • Database Name: ${dbInfo.current_database}`);
    console.log(`   • DB User:       ${dbInfo.current_user}`);
    console.log(`   • Server IP/Port: ${dbInfo.inet_server_addr || 'cloud-host'}:${dbInfo.inet_server_port || 5432}`);

    // Check table counts
    try {
      const candRes = await client.query('SELECT COUNT(*) FROM "candidate";');
      console.log(`   • Candidates Count: ${candRes.rows[0].count}`);
    } catch (e: any) {
      console.log('   • Candidates table not initialized yet.');
    }

    try {
      const userRes = await client.query('SELECT COUNT(*) FROM "user";');
      console.log(`   • Staff Users Count: ${userRes.rows[0].count}`);
    } catch (e: any) {
      console.log('   • Staff User table not initialized yet.');
    }

    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Postgres connection failed:", err.message || err);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

checkPg();
