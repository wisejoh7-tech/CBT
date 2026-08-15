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

redisClient.on("error", (err: any) => {
  logger.error("Redis connection error:", err);
});

// --- Mailer Setup ---
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: config.mail?.host || "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: config.mail?.user,
    pass: config.mail?.pass,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
});
