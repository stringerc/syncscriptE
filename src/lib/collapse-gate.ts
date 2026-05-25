/**
 * CollapseGate — Orchestrated Objective Reduction for action validation
 *
 * Before executing any irreversible action (deploy, delete, file write),
 * the gate enforces a collapse: it reduces the superposition of possible
 * strategies to a single verified action, validates it against acceptance
 * criteria, and only then allows execution.
 *
 * This implements the Orch OR principle that consciousness requires
 * a collapse threshold — a critical mass of computation before a
 * decision becomes "real." Actions that skip the gate are
 * "unconscious" — they execute without validation.
 *
 * Usage:
 *   const gate = new CollapseGate();
 *   const result = gate.evaluate({
 *     action: 'deploy',
 *     agent: 'nexus',
 *     options: [
 *       { label: 'Deploy to production', confidence: 0.9, risk: 'medium' },
 *       { label: 'Deploy to preview', confidence: 0.7, risk: 'low' },
 *     ],
 *     criteria: ['Tests pass', 'Build succeeds', 'No regressions'],
 *     verified: { testsPass: true, buildSucceeds: true, noRegressions: true },
 *   });
 *   if (result.approved) { execute(result.selectedOption); }
 */

export interface CollapseOption {
  label: string;
  confidence: number; // 0–1
  risk: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface CollapseVerification {
  [key: string]: boolean;
}

export interface CollapseInput {
  action: string;
  agent: string;
  topic?: string;
  options: CollapseOption[];
  criteria: string[];
  verified: CollapseVerification;
  override?: boolean; // skip gate (emergency use only)
}

export interface CollapseResult {
  action: string;
  agent: string;
  approved: boolean;
  selectedOption: CollapseOption | null;
  rejectedOptions: CollapseOption[];
  collapseScore: number; // 0–1, how confident the gate is
  failedCriteria: string[];
  reason: string;
}

export class CollapseGate {
  private auditLog: CollapseResult[] = [];
  private maxAuditEntries: number;

  constructor(opts?: { maxAuditEntries?: number }) {
    this.maxAuditEntries = opts?.maxAuditEntries ?? 100;
  }

  evaluate(input: CollapseInput): CollapseResult {
    // Emergency override — log but approve
    if (input.override) {
      const result: CollapseResult = {
        action: input.action,
        agent: input.agent,
        approved: true,
        selectedOption: input.options[0] ?? null,
        rejectedOptions: input.options.slice(1),
        collapseScore: 1.0,
        failedCriteria: [],
        reason: 'OVERRIDE: Gate bypassed by operator',
      };
      this.log(result);
      return result;
    }

    // Step 1: Verify all acceptance criteria
    const failedCriteria = input.criteria.filter(c => !input.verified[c]);
    if (failedCriteria.length > 0) {
      const result: CollapseResult = {
        action: input.action,
        agent: input.agent,
        approved: false,
        selectedOption: null,
        rejectedOptions: input.options,
        collapseScore: 0,
        failedCriteria,
        reason: `FAILED: ${failedCriteria.join(', ')}`,
      };
      this.log(result);
      return result;
    }

    // Step 2: Rank options by confidence, penalize high risk
    const scored = input.options.map(opt => ({
      opt,
      score: opt.confidence * (opt.risk === 'low' ? 1.0 : opt.risk === 'medium' ? 0.8 : 0.5),
    }));
    scored.sort((a, b) => b.score - a.score);

    // Step 3: Collapse — select the highest-scoring option
    const winner = scored[0];
    if (!winner || winner.score < 0.3) {
      const result: CollapseResult = {
        action: input.action,
        agent: input.agent,
        approved: false,
        selectedOption: null,
        rejectedOptions: input.options,
        collapseScore: 0,
        failedCriteria: [],
        reason: `LOW CONFIDENCE: Best option scored ${winner?.score.toFixed(2) ?? 'N/A'}, threshold is 0.3`,
      };
      this.log(result);
      return result;
    }

    const result: CollapseResult = {
      action: input.action,
      agent: input.agent,
      approved: true,
      selectedOption: winner.opt,
      rejectedOptions: scored.slice(1).map(s => s.opt),
      collapseScore: winner.score,
      failedCriteria: [],
      reason: `COLLAPSED: ${winner.opt.label} (score=${winner.score.toFixed(2)})`,
    };
    this.log(result);
    return result;
  }

  getAuditLog(): CollapseResult[] {
    return [...this.auditLog];
  }

  private log(result: CollapseResult): void {
    this.auditLog.push({ ...result });
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog.shift();
    }
  }
}

// Singleton
let globalGate: CollapseGate | null = null;

export function getCollapseGate(): CollapseGate {
  if (!globalGate) {
    globalGate = new CollapseGate();
  }
  return globalGate;
}
