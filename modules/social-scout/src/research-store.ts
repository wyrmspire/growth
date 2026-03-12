import opportunitiesSeed from '../../../data/research/opportunities.seed.json';

export type ResearchOpportunityRecord = (typeof opportunitiesSeed.records)[number];
export type ResearchOpportunityDataset = typeof opportunitiesSeed;

export type ResearchDashboardSummary = {
  totalRecords: number;
  activeRecords: number;
  averageScore: number;
  highestScore: number;
  platformCounts: Array<{ platform: string; count: number }>;
  topOpportunities: Array<{
    id: string;
    platform: string;
    status: string;
    total: number;
    painPoint: string;
    recommendedAction: string;
  }>;
};

export function sentenceCase(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getSeedResearchDataset(): ResearchOpportunityDataset {
  return opportunitiesSeed;
}

export function getSeedResearchRecords(): ResearchOpportunityRecord[] {
  return opportunitiesSeed.records;
}

export function buildResearchDashboardSummary(records: ResearchOpportunityRecord[]): ResearchDashboardSummary {
  const activeRecords = records.filter((record) => record.status === 'new' || record.status === 'reviewing');
  const totalScore = records.reduce((sum, record) => sum + record.scoring.total, 0);
  const platformCounts = new Map<string, number>();

  for (const record of records) {
    platformCounts.set(record.source.platform, (platformCounts.get(record.source.platform) || 0) + 1);
  }

  return {
    totalRecords: records.length,
    activeRecords: activeRecords.length,
    averageScore: records.length ? Math.round(totalScore / records.length) : 0,
    highestScore: records.length ? Math.max(...records.map((record) => record.scoring.total)) : 0,
    platformCounts: [...platformCounts.entries()]
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count || a.platform.localeCompare(b.platform)),
    topOpportunities: [...records]
      .sort((a, b) => b.scoring.total - a.scoring.total || a.id.localeCompare(b.id))
      .slice(0, 3)
      .map((record) => ({
        id: record.id,
        platform: sentenceCase(record.source.platform),
        status: sentenceCase(record.status),
        total: record.scoring.total,
        painPoint: record.painPoint,
        recommendedAction: record.opportunity.recommendedAction,
      })),
  };
}
