import { Request, Response, NextFunction } from "express";
import { redisClient } from "../lib/services";
import { logger } from "../lib/logger";

/**
 * IP Blocker Middleware
 * Checks if the request IP is in the Redis blocklist.
 */
export const ipBlocker = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  if (ip === 'unknown') return next();

  try {
    const isBlocked = await redisClient.get(`blocked_ip:${ip}`);

    if (isBlocked) {
      logger.warn(`SOC Gateway: Blocked request from ${ip}`);
      return res.status(403).json({
        error: "Your IP has been temporarily blocked due to security violations.",
        code: "IP_BLOCKED"
      });
    }
  } catch (err) {
    logger.error("Failed to check IP blocklist in Redis", err);
  }

  next();
};
