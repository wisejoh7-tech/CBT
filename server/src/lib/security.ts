/**
 * Core security definitions and threat patterns for the VIVI SOC Gateway.
 */

export enum ThreatType {
  SQL_INJECTION = "sqli",
  XSS = "xss",
  RATE_LIMIT_EXCEEDED = "rate_limit",
  BRUTE_FORCE = "brute_force",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  PROCTORING_VIOLATION = "proctoring_violation",
}

export interface ThreatPattern {
  id: string;
  type: ThreatType;
  pattern: RegExp;
  description: string;
  riskScore: number; // 0-100
}

export const THREAT_PATTERNS: ThreatPattern[] = [
  {
    id: "sqli-1",
    type: ThreatType.SQL_INJECTION,
    pattern: /('|"|;|\b(OR|AND)\b.*\b(=|>|<|LIKE|IN|IS)\b)/i,
    description: "Common SQL Injection pattern detected in parameters",
    riskScore: 80,
  },
  {
    id: "sqli-2",
    type: ThreatType.SQL_INJECTION,
    pattern: /UNION\s+SELECT|INSERT\s+INTO|DROP\s+TABLE|UPDATE.*SET/i,
    description: "Dangerous SQL keyword usage detected",
    riskScore: 100,
  },
  {
    id: "xss-1",
    type: ThreatType.XSS,
    pattern: /<script.*?>|javascript:|on\w+\s*=|alert\(|eval\(/i,
    description: "Cross-site scripting (XSS) payload detected",
    riskScore: 70,
  }
];

export interface SecurityEvent {
  ip: string;
  userAgent?: string;
  path: string;
  method: string;
  userId?: string;
  threatType: ThreatType;
  description: string;
  metadata?: any;
}
