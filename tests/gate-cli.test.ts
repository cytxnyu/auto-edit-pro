import {describe, expect, it} from 'vitest';
import {approvedGate, requireCumulativeApprovals, requireRenderAuthorization} from '../scripts/lib/gates';

describe('four-gate CLI contract', () => {
  it('treats no approval as Gate A analysis only', () => {
    expect(approvedGate({})).toBe('A');
    expect(approvedGate({'approve-gate-a': true})).toBe('A');
    expect(() => requireCumulativeApprovals({}, 'A')).not.toThrow();
  });

  it('requires the approved plan and execution flags before entering a later gate', () => {
    expect(() => requireCumulativeApprovals({'approve-gate-b': true}, 'B')).toThrow(/approve-gate-a/i);
    expect(() => requireCumulativeApprovals({'approve-gate-a': true, 'approve-gate-b': true, 'approve-gate-c': true}, 'C')).not.toThrow();
    expect(() => requireCumulativeApprovals({'approve-gate-d': true}, 'D')).toThrow(/approve-gate-a.*approve-gate-b/i);
    expect(() => requireCumulativeApprovals({'approve-gate-b': true}, 'C')).toThrow(/approve-gate-a/i);
  });

  it('continues through Gate B to Gate C without an extra C approval', () => {
    const approvedPlan = {'approve-gate-a': true, 'approve-gate-b': true};
    expect(approvedGate(approvedPlan)).toBe('C');
    expect(() => requireCumulativeApprovals(approvedPlan, 'C')).not.toThrow();
    expect(approvedGate({...approvedPlan, render: true})).toBe('C');
  });

  it('supports explicit input-only mode and the legacy C flag', () => {
    const approvedPlan = {'approve-gate-a': true, 'approve-gate-b': true};
    expect(approvedGate({...approvedPlan, 'gate-b-only': true})).toBe('B');
    expect(() => requireCumulativeApprovals(approvedPlan, 'B')).not.toThrow();
    expect(approvedGate({...approvedPlan, 'approve-gate-c': true})).toBe('C');
    expect(approvedGate({...approvedPlan, 'approve-gate-c': true, 'gate-b-only': true})).toBe('B');
  });

  it('refuses final render without explicit Gate D authorization', () => {
    const gateC = {'approve-gate-a': true, 'approve-gate-b': true, render: true};
    expect(() => requireRenderAuthorization(gateC)).toThrow(/approve-gate-d/i);
    const gateD = {...gateC, 'approve-gate-d': true};
    expect(approvedGate(gateD)).toBe('D');
    expect(() => requireRenderAuthorization(gateD)).not.toThrow();
    expect(() => requireRenderAuthorization({...gateD, render: false})).toThrow(/--render/i);
  });
});
