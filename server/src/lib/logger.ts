import winston from "winston";
import { AppDataSource } from "../data-source";
import { Log, LogType, LogSeverity } from "../entities/Log";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : combine(colorize(), logFormat)
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
  type: LogType | "auth" | "security" | "exam" | "system";
  severity: LogSeverity | "info" | "warning" | "error" | "critical";
  message: string;
  userId?: string;
  metadata?: any;
}) {
  const severityStr = data.severity.toString();
  const winstonLevel = severityStr === "critical" ? "error" :
                       severityStr === "warning" ? "warn" : severityStr;

  logger.log(winstonLevel, data.message, { metadata: data.metadata, userId: data.userId });

  try {
    const logRepo = AppDataSource.getRepository(Log);
    const log = logRepo.create({
      type: data.type as LogType,
      severity: data.severity as LogSeverity,
      message: data.message,
      userId: data.userId,
      metadata: data.metadata
    });
    await logRepo.save(log);
  } catch (err) {
    logger.error("Failed to save log to database", err);
  }
}
