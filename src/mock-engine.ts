/**
 * Mock Engine — Translation layer between product UI and module code.
 * This is the ONLY file that imports module mock functions.
 * The UI only sees product-shaped data returned from here.
 */

import { resetIdCounter, EventLog } from '../modules/core/src/index';
import type {
    CampaignBrief, FunnelPlan, ChannelVariantSet, VariantScore,
    ReviewBatch, PublishCalendarEntry, PublishDispatchResult,
    CommentQueueItem, ReplyDraft, AttributionSnapshot, ConversionFunnelRow,
    VariantPerformanceRow, DiscoveryInterview, OfferHypothesis, MarketSignal,
    OfferProfile, ReviewDecision, EntityId,
} from '../modules/core/src/types';
import { validateCampaignBrief } from '../modules/core/src/validation';

import * as strategy from '../modules/strategy/src/mock';
import * as funnel from '../modules/funnel/src/mock';
import * as copylab from '../modules/copylab/src/mock';
import * as approvals from '../modules/approvals/src/mock';
import * as adapters from '../modules/adapters/src/mock';
import * as publishing from '../modules/publishing/src/mock';
import * as comments from '../modules/comments/src/mock';
import * as analytics from '../modules/analytics/src/mock';

// ─── Shared state ────────────────────────────────────────────────
const eventLog = new EventLog();
let currentBrief: CampaignBrief | null = null;
let currentPlan: FunnelPlan | null = null;
let currentVariants: ChannelVariantSet | null = null;
let currentScores: VariantScore[] = [];
let currentInterview: DiscoveryInterview | null = null;
let currentHypotheses: OfferHypothesis[] = [];
let currentSignals: MarketSignal[] = [];
let currentProfile: OfferProfile | null = null;
let currentCommentItems: CommentQueueItem[] = [];
let currentReplies: ReplyDraft[] = [];

// ─── Flow E: Business Discovery ──────────────────────────────────
export function submitDiscoveryInterview(input: {
    businessName: string;
    industry: string;
    targetCustomer: string;
    currentOfferings: string[];
    painPoints: string[];
    competitiveAdvantage: string;
}): DiscoveryInterview {
    currentInterview = strategy.captureInterview(input);
    eventLog.append('InterviewCaptured', currentInterview.id);
    return currentInterview;
}

export function getOfferSuggestions(): OfferHypothesis[] {
    if (!currentInterview) throw new Error('Complete the business discovery first.');
    currentHypotheses = strategy.generateOfferHypotheses(currentInterview, {
        maxHypotheses: 3,
        channels: ['meta', 'linkedin', 'x'],
    });
    currentSignals = strategy.collectMarketSignals({
        allowedDomains: ['industry-trends.com', 'market-insights.io'],
        maxRequests: 5,
        strategy: 'api-first',
    });
    currentHypotheses = strategy.rankHypotheses(currentHypotheses, currentSignals);
    eventLog.append('OfferHypothesesGenerated', currentInterview.id, { count: currentHypotheses.length });
    return currentHypotheses;
}

export function approveOffer(hypothesisIndex: number): OfferProfile {
    const hypothesis = currentHypotheses[hypothesisIndex];
    if (!hypothesis) throw new Error('Invalid offer selection.');
    currentProfile = strategy.buildOfferProfile(hypothesis, currentSignals);
    currentProfile.state = 'approved';
    eventLog.append('OfferProfileApproved', currentProfile.id);
    return currentProfile;
}

// ─── Flow A: Campaign Launch ─────────────────────────────────────
export function createCampaign(input: {
    offerName: string;
    audience: string;
    channels: ('meta' | 'linkedin' | 'x' | 'email')[];
    goals: string[];
}): { brief: CampaignBrief; plan: FunnelPlan; variants: ChannelVariantSet; scores: VariantScore[] } {
    const result = validateCampaignBrief(input);
    if (!result.valid || !result.normalized) {
        throw new Error(result.errors.map(e => e.message).join(', '));
    }

    currentBrief = result.normalized;
    eventLog.append('CampaignDrafted', currentBrief.id);

    currentPlan = funnel.createFunnelPlan(currentBrief);
    eventLog.append('FunnelPlanCreated', currentPlan.id);

    currentVariants = copylab.generateVariants(currentBrief, currentPlan);
    eventLog.append('VariantsGenerated', currentBrief.id, { count: currentVariants.variants.length });

    currentScores = copylab.scoreVariants(currentVariants);
    eventLog.append('VariantsScored', currentBrief.id);

    return {
        brief: currentBrief,
        plan: currentPlan,
        variants: currentVariants,
        scores: currentScores,
    };
}

export function sendToReview(): ReviewBatch {
    if (!currentVariants) throw new Error('Generate copy first.');
    const items = currentVariants.variants.map(v => ({
        id: v.id,
        label: `${v.channel} — ${v.stage} — ${v.headline.slice(0, 40)}...`,
        kind: 'asset' as const,
    }));
    const batch = approvals.createReviewBatch(items);
    eventLog.append('ReviewBatchCreated', batch.id, { items: batch.items.length });
    return batch;
}

// ─── Flow B: Review & Publish ────────────────────────────────────
export function approveItem(itemId: EntityId): void {
    const decision: ReviewDecision = {
        itemId,
        decision: 'approved',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
    };
    approvals.decideReview(decision);
    eventLog.append('AssetApproved', itemId);
}

export function rejectItem(itemId: EntityId): void {
    const decision: ReviewDecision = {
        itemId,
        decision: 'rejected',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
    };
    approvals.decideReview(decision);
    eventLog.append('AssetRejected', itemId);
}

export function approveAll(): void {
    const pending = approvals.getPendingItems();
    pending.forEach(item => approveItem(item.id));
}

export function getReviewItems() {
    return approvals.getAllItems();
}

export function scheduleAll(): PublishCalendarEntry[] {
    if (!currentVariants) return [];

    const now = new Date();
    return currentVariants.variants.map((v, i) => {
        const runAt = new Date(now.getTime() + (i + 1) * 3600_000).toISOString();
        const entry = publishing.scheduleAsset(v.id, `${v.channel} — ${v.stage}`, runAt, v.channel);
        eventLog.append('PublishScheduled', entry.jobId);
        return entry;
    });
}

export function publishNow(): PublishDispatchResult[] {
    const future = new Date(Date.now() + 86400_000 * 30).toISOString();
    const results = publishing.dispatchDue(future);
    results.forEach(r => eventLog.append('PublishDispatched', r.jobId));
    return results;
}

export function getCalendar() {
    return publishing.getCalendar();
}

// ─── Flow C: Comment Operations ──────────────────────────────────
export function pullComments(): CommentQueueItem[] {
    if (!currentBrief) throw new Error('Create a campaign first.');
    const raw = adapters.ingestComments('meta', currentBrief.id);
    eventLog.append('CommentsIngested', currentBrief.id, { count: raw.length });

    currentCommentItems = raw.map(e => {
        const item = comments.triageComment(e.comment);
        eventLog.append('CommentClassified', item.commentId, { intent: item.intent });
        return item;
    });

    const policy = comments.getDefaultReplyPolicy();
    currentReplies = currentCommentItems
        .map(item => comments.draftReply(item, policy))
        .filter((r): r is ReplyDraft => r !== null);

    currentReplies.forEach(r => eventLog.append('ReplyDrafted', r.id));

    return currentCommentItems;
}

export function getCommentReplies(): ReplyDraft[] {
    return currentReplies;
}

export function sendReplies(): void {
    currentReplies.forEach(reply => {
        approveItem(reply.id);
        eventLog.append('CommentReplied', reply.id);
    });
}

// ─── Flow D: Dashboard ──────────────────────────────────────────
export function getDashboard(): {
    attribution: AttributionSnapshot;
    funnel: ConversionFunnelRow[];
    variants: VariantPerformanceRow[];
} {
    const campId = currentBrief?.id || ('' as EntityId);
    const planId = currentPlan?.id || ('' as EntityId);
    const events = eventLog.all();

    return {
        attribution: analytics.projectAttribution(events, campId),
        funnel: analytics.projectFunnelConversion(events, planId),
        variants: analytics.projectVariantPerformance(events),
    };
}

// ─── State access ────────────────────────────────────────────────
export function getEventLog() {
    return eventLog.all();
}

export function getCurrentBrief() { return currentBrief; }
export function getCurrentPlan() { return currentPlan; }
export function getCurrentVariants() { return currentVariants; }
export function getCurrentScores() { return currentScores; }
export function getCurrentInterview() { return currentInterview; }
export function getCurrentHypotheses() { return currentHypotheses; }
export function getCurrentProfile() { return currentProfile; }

export function resetAll(): void {
    resetIdCounter();
    eventLog.clear();
    approvals.resetStore();
    publishing.resetCalendar();
    currentBrief = null;
    currentPlan = null;
    currentVariants = null;
    currentScores = [];
    currentInterview = null;
    currentHypotheses = [];
    currentSignals = [];
    currentProfile = null;
    currentCommentItems = [];
    currentReplies = [];
}
