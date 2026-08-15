import { Log, LogType, LogSeverity } from "../entities/Log";
import { redisClient } from "./services";
import { logger } from "./logger";
import { AppDataSource } from "../data-source";
import { Candidate } from "../entities/Candidate";
import { Attempt } from "../entities/Attempt";

/**
 * Automation Engine
 * Reacts to security logs and executes automated "Playbooks".
 */
export class AutomationEngine {
  private static instance: AutomationEngine;
  private io: any;

  private constructor() {}

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  public setSocketIO(io: any) {
    this.io = io;
  }

  /**
   * Main entry point for log processing
   */
  public async processLog(log: Log) {
    if (log.type !== LogType.SECURITY) return;

    logger.debug(`Automation Engine: Processing security log ${log.id}`);

    try {
      // 1. Alert Admins via Socket.io
      if (this.io) {
        this.io.emit("security-alert", {
          id: log.id,
          message: log.message,
          severity: log.severity,
          userId: log.userId,
          timestamp: log.timestamp
        });
      }

      // 2. Automated Response Playbooks
      if (log.severity === LogSeverity.CRITICAL) {
        await this.executeCriticalPlaybook(log);
      }

      // 3. Proctoring specific logic
      if (log.message.includes("proctoring") || log.metadata?.threatType === "proctoring_violation") {
        await this.handleProctoringViolation(log);
      }

    } catch (error) {
      logger.error("Automation Engine failed to execute playbook", error);
    }
  }

  private async executeCriticalPlaybook(log: Log) {
    const ip = log.metadata?.ip;
    if (ip && ip !== 'unknown') {
      // Block IP in Redis for 1 hour
      await redisClient.set(`blocked_ip:${ip}`, "true", { EX: 3600 });
      logger.warn(`Automation Engine: BLOCKED IP ${ip} for 1 hour due to critical threat.`);
    }
  }

  private async handleProctoringViolation(log: Log) {
    if (!log.userId) return;

    const attemptRepo = AppDataSource.getRepository(Attempt);
    const activeAttempt = await attemptRepo.findOne({
      where: { userId: log.userId, status: "in-progress" as any }
    });

    if (activeAttempt) {
      const adjustment = log.metadata?.trustScoreAdjustment || -10;
      activeAttempt.trustScore = Math.max(0, (activeAttempt.trustScore || 100) + adjustment);

      // Save violation to logs array if it exists (assuming Attempt has violationLogs)
      if (!activeAttempt.violationLogs) activeAttempt.violationLogs = [];
      activeAttempt.violationLogs.push({
        timestamp: new Date(),
        reason: log.message,
        severity: log.severity
      });

      await attemptRepo.save(activeAttempt);
      logger.info(`Automation Engine: Adjusted trust score for candidate ${log.userId} to ${activeAttempt.trustScore}%`);
    }
  }
}

export const automationEngine = AutomationEngine.getInstance();
