import { Request, Response, NextFunction } from "express";
import { THREAT_PATTERNS, ThreatType } from "../lib/security";
import { createLog } from "../lib/logger";
import { LogType, LogSeverity } from "../entities/Log";

/**
 * SOC Gateway Middleware
 * Monitors all incoming requests for known attack patterns and logs threats.
 */
export const socGateway = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const path = req.path;
  const method = req.method;

  // Inspect Body, Query, and Params
  const inputs = [
    { source: "body", data: JSON.stringify(req.body) },
    { source: "query", data: JSON.stringify(req.query) },
    { source: "params", data: JSON.stringify(req.params) }
  ];

  for (const input of inputs) {
    if (!input.data || input.data === '{}') continue;

    for (const pattern of THREAT_PATTERNS) {
      if (pattern.pattern.test(input.data)) {
        // Threat detected!
        await createLog({
          type: LogType.SECURITY,
          severity: pattern.riskScore > 80 ? LogSeverity.CRITICAL : LogSeverity.WARNING,
          message: `SOC Gateway: ${pattern.description} in request ${input.source}`,
          userId: (req as any).user?.id,
          metadata: {
            ip,
            path,
            method,
            threatId: pattern.id,
            threatType: pattern.type,
            inputSource: input.source,
            userAgent: req.headers['user-agent']
          }
        });

        // Block highly critical threats immediately
        if (pattern.riskScore >= 100) {
          return res.status(403).json({
            error: "Security violation detected. Request blocked by VIVI SOC Gateway.",
            reference: Date.now().toString(36)
          });
        }
      }
    }
  }

  next();
};
