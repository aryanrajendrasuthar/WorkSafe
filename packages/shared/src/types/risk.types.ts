export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RiskScore {
  entityType: 'WORKER' | 'DEPARTMENT' | 'ORGANIZATION';
  entityId: string;
  score: number;
  level: RiskLevel;
  computedAt: string;
  factors: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return RiskLevel.CRITICAL;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '#22c55e',
  [RiskLevel.MEDIUM]: '#f59e0b',
  [RiskLevel.HIGH]: '#f97316',
  [RiskLevel.CRITICAL]: '#ef4444',
};
