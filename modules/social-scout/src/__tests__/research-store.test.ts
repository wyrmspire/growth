import { describe, expect, it } from 'vitest';
import {
  buildResearchDashboardSummary,
  getSeedResearchDataset,
  getSeedResearchRecords,
  sentenceCase,
} from '../research-store';

describe('research-store', () => {
  it('exposes the seed dataset and records', () => {
    const dataset = getSeedResearchDataset();
    const records = getSeedResearchRecords();

    expect(dataset.version).toBe(1);
    expect(records).toHaveLength(dataset.records.length);
    expect(records[0]?.id).toBe('research-001');
  });

  it('builds the expected dashboard summary from the seed records', () => {
    const summary = buildResearchDashboardSummary(getSeedResearchRecords());

    expect(summary.totalRecords).toBe(3);
    expect(summary.activeRecords).toBe(2);
    expect(summary.averageScore).toBe(36);
    expect(summary.highestScore).toBe(39);
    expect(summary.platformCounts).toEqual([
      { platform: 'facebook', count: 1 },
      { platform: 'linkedin', count: 1 },
      { platform: 'reddit', count: 1 },
    ]);
    expect(summary.topOpportunities).toEqual([
      expect.objectContaining({ id: 'research-001', platform: 'Reddit', status: 'New', total: 39 }),
      expect.objectContaining({ id: 'research-002', platform: 'Linkedin', status: 'Reviewing', total: 38 }),
      expect.objectContaining({ id: 'research-003', platform: 'Facebook', status: 'Parked', total: 30 }),
    ]);
  });

  it('handles empty summaries without NaN or negative values', () => {
    const summary = buildResearchDashboardSummary([]);

    expect(summary).toEqual({
      totalRecords: 0,
      activeRecords: 0,
      averageScore: 0,
      highestScore: 0,
      platformCounts: [],
      topOpportunities: [],
    });
  });

  it('sentence-cases kebab strings for labels', () => {
    expect(sentenceCase('manual-review-only')).toBe('Manual Review Only');
  });
});
