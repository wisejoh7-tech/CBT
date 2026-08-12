import { AppDataSource } from "./data-source"; // TypeORM DataSource
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

async function testConnections() {
  console.log("--- Connection Test ---");

  // Test Postgres
  console.log("Testing Postgres connection...");
  try {
    await AppDataSource.initialize();
    console.log("✅ Postgres Connected Successfully");
    await AppDataSource.destroy(); // close connection after test
  } catch (error) {
    console.error("❌ Postgres Connection Failed:", error);
  }

  // Test Redis
  console.log("Testing Redis connection...");
  const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  redisClient.on("error", (err) =>
    console.error("Redis Error Event:", err.message)
  );

  try {
    await redisClient.connect();
    console.log("✅ Redis Connected Successfully");
    await redisClient.disconnect(); // close connection after test
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
  }

  process.exit(0); // exit cleanly
}

testConnections();
