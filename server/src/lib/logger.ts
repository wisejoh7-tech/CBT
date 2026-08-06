import winston from "winston";
import { AppDataSource } from "../data-source";
import { Log } from "../entities/Log";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    process.env.NODE_ENV === "production" ? winston.format.json() : combine(colorize(), logFormat)
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
});

export async function createLog(data: {
  type: 'auth' | 'security' | 'exam' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  userId?: string;
  metadata?: any;
}) {
  // Log to winston
  const winstonLevel = data.severity === 'critical' ? 'error' : data.severity;
  logger.log(winstonLevel, data.message, { metadata: data.metadata, userId: data.userId });

  // Log to Database
  try {
    const logRepo = AppDataSource.getRepository(Log);
    const log = logRepo.create(data);
    await logRepo.save(log);
  } catch (err) {
    logger.error("Failed to save log to database", err);
  }
}
