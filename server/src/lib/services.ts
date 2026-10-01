// src/lib/services.ts
import "reflect-metadata";

import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import nodemailer from "nodemailer";
import { config } from "./config"; // named import (matches src/lib/config.ts)
import { logger } from "./logger";

// --- Redis Client with Memory Fallback ---
const memoryStore = new Map<string, string>();

const realRedisClient = createClient({
  url: config.redisUrl,
  socket: {
    tls: config.redisUrl?.startsWith("rediss://"),
    rejectUnauthorized: false,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        // Stop retrying after 3 failures to prevent console spam
        return new Error("Redis reconnection exhausted");
      }
      return 5000; // Retry every 5 seconds
    }
  }
});

const subClient = realRedisClient.duplicate();

let errorLogged = false;
realRedisClient.on("error", (err: any) => {
  if (!errorLogged) {
    logger.warn("Redis connection could not be established. Enabling Memory Fallback.");
    logger.debug(`Redis technical detail: ${err.message}`);
    errorLogged = true;
  }
});

subClient.on("error", (err: any) => {
  // Silent fallback for duplicate pub/sub client
});

export const redisClient = {
  connect: async () => {
    try {
      await Promise.all([
        realRedisClient.connect(),
        subClient.connect()
      ]);
      return true;
    } catch (err) {
      logger.warn("Redis connection failed. Using Memory Fallback.");
      return false;
    }
  },
  disconnect: () => {
    realRedisClient.disconnect();
    subClient.disconnect();
  },
  getAdapter: () => {
    if (realRedisClient.isOpen && subClient.isOpen) {
      return createAdapter(realRedisClient, subClient);
    }
    return null;
  },
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
const mailUser = config.mail?.user;
const mailPass = config.mail?.pass;

export const transporter = nodemailer.createTransport({
  ...(mailUser && mailPass ? {
    service: 'gmail',
    auth: { user: mailUser, pass: mailPass },
  } : {
    host: config.mail?.host || "smtp.gmail.com",
    port: Number(config.mail?.port) || 587,
    secure: false,
  }),
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
});

export const sendEmailSafely = async (options: nodemailer.SendMailOptions): Promise<boolean> => {
  if (!config.mail?.user || !config.mail?.pass) {
    logger.warn(`[Mailer] MAIL_USER or MAIL_PASS not configured. Skipping email to ${options.to}.`);
    return false;
  }
  try {
    const fromAddress = config.mail.user;
    await transporter.sendMail({
      ...options,
      from: `"VIVI CBT Support" <${fromAddress}>`
    });
    return true;
  } catch (err: any) {
    logger.error(`[Mailer] Failed to send email to ${options.to}:`, err.message || err);
    return false;
  }
};
