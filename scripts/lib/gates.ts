export type Args = Record<string, string | boolean>;
export type Gate = 'A' | 'B' | 'C' | 'D';

export const approvedGate = (args: Args): Gate => {
  if (args['approve-gate-d'] === true) return 'D';
  if (args['gate-b-only'] === true) return 'B';
  if (args['approve-gate-c'] === true) return 'C';
  // Approval of this job's plan authorizes input preparation and review stills.
  // Keep the historical A/B CLI flags; C needs no additional human approval.
  if (args['approve-gate-b'] === true) return 'C';
  return 'A';
};

const requiredApprovals: Record<Gate, string[]> = {
  A: [],
  B: ['approve-gate-a', 'approve-gate-b'],
  C: ['approve-gate-a', 'approve-gate-b'],
  D: ['approve-gate-a', 'approve-gate-b', 'approve-gate-d'],
};

export const requireCumulativeApprovals = (args: Args, target: Gate): void => {
  const missing = requiredApprovals[target].filter((name) => args[name] !== true);
  if (missing.length > 0) {
    throw new Error(`Missing explicit approvals: ${missing.map((name) => `--${name}`).join(', ')}`);
  }
};

export const requireRenderAuthorization = (args: Args): void => {
  if (args.render !== true) throw new Error('Final render requires --render');
  requireCumulativeApprovals(args, 'D');
};
