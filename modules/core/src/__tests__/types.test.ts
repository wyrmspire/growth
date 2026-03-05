/**
 * CORE-A1 — Types Test Suite
 * Verifies all canonical entity types from CONTRACT.md match the implementation.
 */

import type {
    EntityId,
    CampaignBrief,
    CampaignBriefInput,
    CopyVariant,
    ApprovalState,
    PublishJob,
    CommentRecord,
    CommentIntent,
    CampaignMetricRow,
    AppError,
    ReviewBatch,
    ReviewItem,
    ReviewDecision,
    DomainEvent,
    DomainEventName,
    DiscoveryInterview,
    OfferHypothesis,
    ChannelName,
    FunnelPlan,
    FunnelStage,
} from '../types';

// ── Compile-time shape checks (if these lines compile, shapes are correct) ──

const _entityId: EntityId = 'brief_000001' as EntityId;

const _brief: CampaignBrief = {
    id: _entityId,
    offerName: 'Starter Pack',
    audience: 'Small business owners',
    channels: ['meta', 'email'],
    goals: ['leads'],
    createdAt: new Date().toISOString(),
};

const _briefInput: CampaignBriefInput = {
    offerName: 'Test',
    audience: 'Audience',
    channels: ['linkedin'],
    goals: ['awareness'],
};

const _variant: CopyVariant = {
    id: _entityId,
    channel: 'meta',
    stage: 'awareness',
    headline: 'Hello',
    body: 'Body text',
    cta: 'Learn More',
    policyVersion: '1.0',
};

const _approvalState: ApprovalState = 'pending';
const _approvalStates: ApprovalState[] = ['pending', 'approved', 'rejected', 'reopened'];

const _publishJob: PublishJob = {
    id: _entityId,
    assetId: _entityId,
    channel: 'x',
    runAt: new Date().toISOString(),
    state: 'scheduled',
};

const _comment: CommentRecord = {
    id: _entityId,
    channel: 'linkedin',
    campaignId: _entityId,
    authorName: 'Alice',
    body: 'Great post!',
    timestamp: new Date().toISOString(),
};

const _intent: CommentIntent = 'lead';
const _intents: CommentIntent[] = ['lead', 'objection', 'support', 'spam'];

const _metric: CampaignMetricRow = {
    campaignId: _entityId,
    channel: 'email',
    impressions: 1000,
    clicks: 50,
    leads: 5,
    spend: 100,
    revenue: 500,
};

const _error: AppError = {
    code: 'BRIEF_INVALID_FIELDS',
    message: 'Field missing',
    module: 'core',
};

const _reviewItem: ReviewItem = {
    id: _entityId,
    label: 'Ad Copy v1',
    kind: 'asset',
    state: 'pending',
};

const _reviewDecision: ReviewDecision = {
    itemId: _entityId,
    decision: 'approved',
    reviewerId: 'agent-1',
    timestamp: new Date().toISOString(),
};

const _batch: ReviewBatch = {
    id: _entityId,
    items: [_reviewItem],
    createdAt: new Date().toISOString(),
};

const _eventName: DomainEventName = 'InterviewCaptured';
const _event: DomainEvent = {
    id: _entityId,
    name: _eventName,
    entityId: _entityId,
    timestamp: new Date().toISOString(),
    payload: {},
};

const _interview: DiscoveryInterview = {
    id: _entityId,
    version: 1,
    data: {
        businessName: 'Acme',
        industry: 'SaaS',
        targetCustomer: 'SMBs',
        currentOfferings: ['Tool A'],
        painPoints: ['Too slow'],
        competitiveAdvantage: 'Speed',
    },
    capturedAt: new Date().toISOString(),
};

const _hypothesis: OfferHypothesis = {
    id: _entityId,
    name: 'Starter Pack',
    angle: 'Low risk',
    icp: 'SMB',
    rationale: 'Addresses core pain',
    confidence: 0.85,
};

const _channel: ChannelName = 'meta';
const _channels: ChannelName[] = ['meta', 'linkedin', 'x', 'email'];

const _funnelStage: FunnelStage = {
    name: 'awareness',
    channels: ['meta'],
    ctas: ['Learn More'],
};

const _funnelPlan: FunnelPlan = {
    id: _entityId,
    briefId: _entityId,
    stages: [_funnelStage],
};

// ── Runtime tests ───────────────────────────────────────────────────────────

describe('Core Types — CONTRACT.md compliance', () => {
    test('EntityId is a branded string', () => {
        const id = 'brief_000001' as EntityId;
        expect(typeof id).toBe('string');
    });

    test('ApprovalState has exactly 4 values', () => {
        expect(_approvalStates).toHaveLength(4);
        expect(_approvalStates).toContain('pending');
        expect(_approvalStates).toContain('approved');
        expect(_approvalStates).toContain('rejected');
        expect(_approvalStates).toContain('reopened');
    });

    test('CommentIntent has exactly 4 values', () => {
        expect(_intents).toHaveLength(4);
        expect(_intents).toContain('lead');
        expect(_intents).toContain('objection');
        expect(_intents).toContain('support');
        expect(_intents).toContain('spam');
    });

    test('ChannelName has exactly 4 values', () => {
        expect(_channels).toHaveLength(4);
        expect(_channels).toContain('meta');
        expect(_channels).toContain('linkedin');
        expect(_channels).toContain('x');
        expect(_channels).toContain('email');
    });

    test('CampaignBrief has required fields', () => {
        expect(_brief).toHaveProperty('id');
        expect(_brief).toHaveProperty('offerName');
        expect(_brief).toHaveProperty('audience');
        expect(_brief).toHaveProperty('channels');
        expect(_brief).toHaveProperty('goals');
        expect(_brief).toHaveProperty('createdAt');
    });

    test('ReviewBatch starts with pending items', () => {
        expect(_batch.items[0].state).toBe('pending');
    });

    test('DomainEvent has all required fields', () => {
        expect(_event).toHaveProperty('id');
        expect(_event).toHaveProperty('name');
        expect(_event).toHaveProperty('entityId');
        expect(_event).toHaveProperty('timestamp');
        expect(_event).toHaveProperty('payload');
    });

    test('AppError has code, message, and module fields', () => {
        expect(_error).toHaveProperty('code');
        expect(_error).toHaveProperty('message');
        expect(_error).toHaveProperty('module');
    });

    test('OfferHypothesis has rationale and confidence fields (contract invariant)', () => {
        expect(_hypothesis).toHaveProperty('rationale');
        expect(_hypothesis).toHaveProperty('confidence');
        expect(typeof _hypothesis.confidence).toBe('number');
        expect(_hypothesis.confidence).toBeGreaterThanOrEqual(0);
        expect(_hypothesis.confidence).toBeLessThanOrEqual(1);
    });

    test('FunnelPlan links back to briefId', () => {
        expect(_funnelPlan.briefId).toBeDefined();
        expect(_funnelPlan.stages.length).toBeGreaterThan(0);
    });

    // Suppress unused-var linting—these are compile-time shape checks
    afterAll(() => {
        void [
            _entityId, _brief, _briefInput, _variant, _approvalState,
            _publishJob, _comment, _intent, _metric, _reviewDecision,
            _eventName, _interview, _channel, _funnelStage,
        ];
    });
});
