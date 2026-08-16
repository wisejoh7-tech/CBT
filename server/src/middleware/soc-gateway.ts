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

  // Helper to check for threats recursively in objects/arrays
  const checkValue = async (val: any, source: string): Promise<boolean> => {
    if (!val) return false;

    if (typeof val === 'string') {
      // Only check strings longer than 4 chars
      if (val.length < 4) return false;

      for (const pattern of THREAT_PATTERNS) {
        if (pattern.pattern.test(val)) {
          await createLog({
            type: LogType.SECURITY,
            severity: pattern.riskScore > 80 ? LogSeverity.CRITICAL : LogSeverity.WARNING,
            message: `SOC Gateway: ${pattern.description} in ${source}`,
            userId: (req as any).user?.id,
            metadata: { ip, path, method, threatType: pattern.type, value: val }
          });
          return pattern.riskScore >= 100; // Return true only if we should block
        }
      }
    } else if (typeof val === 'object') {
      for (const k in val) {
        if (await checkValue(val[k], `${source}.${k}`)) return true;
      }
    }
    return false;
  };

  try {
    const shouldBlockBody = await checkValue(req.body, "body");
    const shouldBlockQuery = await checkValue(req.query, "query");
    const shouldBlockParams = await checkValue(req.params, "params");

    if (shouldBlockBody || shouldBlockQuery || shouldBlockParams) {
      return res.status(403).json({
        error: "Security violation detected. Request blocked by VIVI SOC Gateway.",
        reference: Date.now().toString(36)
      });
    }
  } catch (err) {
    // If the check fails, we log and continue rather than blocking legitimate traffic
    console.error("SOC Gateway error:", err);
  }

  next();
};
