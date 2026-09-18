import winston from "winston";
import "winston-daily-rotate-file";
import { AppDataSource } from "../data-source";
import { Log, LogType, LogSeverity } from "../entities/Log";
import { automationEngine } from "./automation-engine";

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
          new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
          }),
          new winston.transports.DailyRotateFile({
            level: 'error',
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d'
          })
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
    const savedLog = await logRepo.save(log);

    // Trigger Automation Engine
    automationEngine.processLog(savedLog).catch(err => {
      logger.error("Failed to process log in Automation Engine", err);
    });
  } catch (err) {
    logger.error("Failed to save log to database", err);
  }
}
