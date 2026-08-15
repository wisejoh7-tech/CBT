// src/lib/services.ts
import "reflect-metadata";

import { createClient } from "redis";
import nodemailer from "nodemailer";
import { config } from "./config"; // named import (matches src/lib/config.ts)
import { logger } from "./logger";

// --- Redis Client with Memory Fallback ---
const memoryStore = new Map<string, string>();

const realRedisClient = createClient({
  url: config.redisUrl,
  socket: config.redisUrl?.startsWith("rediss://")
    ? { tls: true, rejectUnauthorized: false }
    : undefined
});

realRedisClient.on("error", (err: any) => {
  logger.error("Redis connection error (IP allowlist likely):", err.message);
});

export const redisClient = {
  connect: () => realRedisClient.connect().catch(() => logger.warn("Redis failed. Using Memory Fallback.")),
  disconnect: () => realRedisClient.disconnect(),
  set: async (key: string, value: string, options?: any) => {
    try {
      if (realRedisClient.isOpen) return await realRedisClient.set(key, value, options);
    } catch (e) {}
    memoryStore.set(key, value);
    if (options?.EX) setTimeout(() => memoryStore.delete(key), options.EX * 1000);
    return "OK";
  },
  get: async (key: string) => {
    try {
      if (realRedisClient.isOpen) return await realRedisClient.get(key);
    } catch (e) {}
    return memoryStore.get(key) || null;
  },
  del: async (key: string) => {
    try {
      if (realRedisClient.isOpen) return await realRedisClient.del(key);
    } catch (e) {}
    return memoryStore.delete(key) ? 1 : 0;
  },
  isOpen: false, // Compatibility
  on: (event: string, cb: Function) => realRedisClient.on(event as any, cb as any),
};

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
