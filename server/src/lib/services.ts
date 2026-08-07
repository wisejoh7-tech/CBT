import { createClient } from "redis";
import nodemailer from "nodemailer";
import { config } from "./config";
import { logger } from "./logger";

// Redis Client
export const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

// Mailer Setup
export const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(config.MAIL_PORT || "587"),
  secure: false,
  auth: {
    user: config.MAIL_USER,
    pass: config.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
