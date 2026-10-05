// src/lib/services.ts
import "reflect-metadata";

import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import nodemailer from "nodemailer";
import { Resend } from "resend";
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
export const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

const mailUser = config.mail?.user;
const mailPass = config.mail?.pass;
const mailHost = config.mail?.host || (config.resendApiKey ? "smtp.resend.com" : "smtp.gmail.com");
const mailPort = Number(config.mail?.port) || 587;
const isSecure = mailPort === 465;

export const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: isSecure, // true for 465, false for other ports (e.g. 587 with STARTTLS)
  ...((mailUser || config.resendApiKey) && (mailPass || config.resendApiKey) ? {
    auth: {
      user: mailUser || "resend",
      pass: mailPass || config.resendApiKey,
    },
  } : {}),
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
});

export const sendEmailSafely = async (options: nodemailer.SendMailOptions): Promise<boolean> => {
  const recipient = Array.isArray(options.to)
    ? options.to.map((item) => (typeof item === "string" ? item : item.address)).join(", ")
    : typeof options.to === "string"
      ? options.to
      : options.to && typeof options.to === "object" && "address" in options.to
        ? options.to.address
        : "";

  // Strategy 1: Resend HTTP API SDK
  if (resend && config.resendApiKey) {
    try {
      const fromAddress =
        (options.from as string) ||
        config.resendFromEmail ||
        "VIVI CBT Support <onboarding@resend.dev>";

      const recipients = recipient ? recipient.split(",").map((s) => s.trim()) : [];

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: recipients,
        subject: options.subject || "VIVI CBT Notification",
        html: (options.html as string) || (options.text as string) || "",
        text: (options.text as string) || undefined,
      });

      if (error) {
        logger.error(`[Mailer/Resend] Failed to send email to ${recipient}:`, error.message || error);
        return false;
      }

      logger.info(`[Mailer/Resend] Email sent successfully to ${recipient} (id: ${data?.id})`);
      return true;
    } catch (err: any) {
      logger.error(`[Mailer/Resend] Exception sending email to ${recipient}:`, err.message || err);
      return false;
    }
  }

  // Strategy 2: Nodemailer SMTP Transporter
  const hasSmtpConfig = (config.mail?.user && config.mail?.pass) || mailHost === "smtp.resend.com";
  if (!hasSmtpConfig) {
    logger.warn(`[Mailer] Neither RESEND_API_KEY nor SMTP credentials configured. Skipping email to ${recipient}.`);
    return false;
  }

  try {
    const fromAddress =
      (options.from as string) ||
      config.resendFromEmail ||
      config.mail?.user ||
      "VIVI CBT Support <onboarding@resend.dev>";

    await transporter.sendMail({
      from: fromAddress,
      ...options,
    });
    logger.info(`[Mailer/SMTP] Email sent successfully to ${recipient}`);
    return true;
  } catch (err: any) {
    logger.error(`[Mailer/SMTP] Failed to send email to ${recipient}:`, err.message || err);
    return false;
  }
};

export const sendVerificationEmail = async (
  userEmail: string,
  verificationLink: string,
  customFrom?: string
): Promise<boolean> => {
  const fromAddress = customFrom || config.resendFromEmail || "VIVI CBT onboarding@yourdomain.com";
  const subject = "Verify your VIVI CBT account";
  const html = `<h2>Welcome to VIVI CBT</h2> <p>Please verify your account by clicking the link below.</p> <a href="${verificationLink}">Verify Account</a>`;

  if (resend && config.resendApiKey) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: userEmail,
        subject,
        html,
      });

      if (error) {
        logger.error(`[Mailer/Resend] Failed to send verification email to ${userEmail}:`, error.message || error);
        return false;
      }

      logger.info(`[Mailer/Resend] Verification email sent to ${userEmail} (id: ${data?.id})`);
      return true;
    } catch (err: any) {
      logger.error(`[Mailer/Resend] Exception sending verification email to ${userEmail}:`, err.message || err);
      return false;
    }
  }

  return sendEmailSafely({
    from: fromAddress,
    to: userEmail,
    subject,
    html,
  });
};
