// src/lib/services.ts
import "reflect-metadata";

import { createClient } from "redis";
import nodemailer from "nodemailer";
import { config } from "./config"; // named import (matches src/lib/config.ts)
import { logger } from "./logger";

// --- Redis Client ---
export const redisClient = createClient({
  url: config.redisUrl,
  socket: config.redisUrl?.startsWith("rediss://")
    ? { tls: true, rejectUnauthorized: false }
    : undefined
});

redisClient.on("error", (err) => {
  logger.error("Redis connection error:", err);
});

// --- Mailer Setup ---
export const transporter = nodemailer.createTransport({
  host: config.mail?.host || "smtp.gmail.com",
  port: Number(config.mail?.port) || 587,
  secure: false,
  auth: {
    user: config.mail?.user,
    pass: config.mail?.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
