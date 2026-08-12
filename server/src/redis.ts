import { createClient } from "redis";
import { config } from "./lib/config";
import { logger } from "./lib/logger";

const redisClient = createClient({
  url: config.redisUrl,
  socket: config.redisUrl?.startsWith("rediss://")
    ? { tls: true, rejectUnauthorized: false }
    : undefined
});

async function initRedis() {
  try {
    await redisClient.connect();
    logger.info("Redis connected successfully");
  } catch (err) {
    logger.error("Redis connection failed", err);
  }
}

initRedis();

export { redisClient };
