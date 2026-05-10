import { describe, it, expect } from 'vitest';
import { aggregateRisk } from '../riskAggregator';
import type { AccountFingerprint, AlertPayload } from '../../../shared/dto/modsignal';

const makeAlert = (overrides: Partial<AlertPayload> = {}): AlertPayload => ({
  id: 'a1',
  subreddit: 'test',
  type: 'burst',
  severity: 'medium',
  reasonCodes: ['high_z_score'],
  affectedUsers: [],
  relatedPosts: [],
  relatedComments: [],
  score: 60,
  timestamp: Date.now(),
  dismissed: false,
  ...overrides,
});

describe('aggregateRisk', () => {
  it('returns none for no alerts', () => {
    const risk = aggregateRisk([]);
    expect(risk.recommendedAction).toBe('none');
    expect(risk.totalAlertCount).toBe(0);
  });

  it('returns watch for single low alert', () => {
    const risk = aggregateRisk([makeAlert({ severity: 'low' })]);
    expect(risk.recommendedAction).toBe('watch');
  });

  it('returns restrict for many alerts', () => {
    const alerts = Array.from({ length: 3 }, (_, i) => makeAlert({ id: `a${i}` }));
    const risk = aggregateRisk(alerts);
    expect(risk.recommendedAction).toBe('restrict');
  });

  it('returns lock for critical severity', () => {
    const risk = aggregateRisk([makeAlert({ severity: 'critical' })]);
    expect(risk.recommendedAction).toBe('lock');
  });

  it('tracks unique users', () => {
    const alerts = [
      makeAlert({ affectedUsers: [{ userId: 'u1' } as unknown as AccountFingerprint] }),
      makeAlert({ affectedUsers: [{ userId: 'u1' } as unknown as AccountFingerprint] }),
    ];
    const risk = aggregateRisk(alerts);
    expect(risk.uniqueUsersFlagged).toBe(1);
  });

  it('aggregates reason codes', () => {
    const alerts = [
      makeAlert({ reasonCodes: ['high_z_score'] }),
      makeAlert({ reasonCodes: ['new_account_surge', 'high_z_score'] }),
    ];
    const risk = aggregateRisk(alerts);
    expect(risk.topReasonCodes[0]).toBe('high_z_score');
  });
});
