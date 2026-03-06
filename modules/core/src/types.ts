// ─── Entity IDs ───────────────────────────────────────────────────
export type EntityId = string & { readonly __brand: 'EntityId' };

export type IdPrefix =
    | 'camp'
    | 'offer'
    | 'brief'
    | 'copy'
    | 'var'
    | 'batch'
    | 'item'
    | 'job'
    | 'reply'
    | 'comment'
    | 'plan'
    | 'hyp'
    | 'sig'
    | 'prof'
    | 'int'
    | 'style'
    | 'srun'
    | 'opp'
    | 'eng'
    | 'dec'
    | 'prev';

// ─── Campaign Brief ──────────────────────────────────────────────
export interface CampaignBriefInput {
    offerName: string;
    audience: string;
    channels: ChannelName[];
    goals: string[];
}

export interface CampaignBrief {
    id: EntityId;
    offerName: string;
    audience: string;
    channels: ChannelName[];
    goals: string[];
    createdAt: string;
}

export type ChannelName = 'meta' | 'linkedin' | 'x' | 'email';

// ─── Funnel ──────────────────────────────────────────────────────
export type FunnelStageName = 'awareness' | 'consideration' | 'decision';

export interface FunnelStage {
    name: FunnelStageName;
    channels: ChannelName[];
    ctas: string[];
}

export interface FunnelPlan {
    id: EntityId;
    briefId: EntityId;
    stages: FunnelStage[];
}

// ─── Copy Variants ───────────────────────────────────────────────
export interface CopyVariant {
    id: EntityId;
    channel: ChannelName;
    stage: FunnelStageName;
    headline: string;
    body: string;
    cta: string;
    policyVersion: string;
}

export interface CopyPolicy {
    id: string;
    version: string;
    maxLength: Record<ChannelName, number>;
    bannedTerms: string[];
}

export interface ChannelVariantSet {
    briefId: EntityId;
    policyVersion: string;
    variants: CopyVariant[];
}

export interface VariantScore {
    variantId: EntityId;
    score: number;
    reasons: string[];
}

// ─── Approvals ───────────────────────────────────────────────────
export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'reopened';

export interface ReviewItem {
    id: EntityId;
    label: string;
    kind: 'asset' | 'reply' | 'offer';
    state: ApprovalState;
}

export interface ReviewDecision {
    itemId: EntityId;
    decision: 'approved' | 'rejected';
    reviewerId: string;
    timestamp: string;
    note?: string;
}

export interface ReviewBatch {
    id: EntityId;
    items: ReviewItem[];
    createdAt: string;
}

// ─── Publishing ──────────────────────────────────────────────────
export interface PublishJob {
    id: EntityId;
    assetId: EntityId;
    channel: ChannelName;
    runAt: string;
    state: 'scheduled' | 'dispatched' | 'failed';
}

export interface PublishCalendarEntry {
    jobId: EntityId;
    assetLabel: string;
    channel: ChannelName;
    runAt: string;
    state: PublishJob['state'];
}

export interface PublishDispatchResult {
    jobId: EntityId;
    channel: ChannelName;
    success: boolean;
    receipt?: string;
}

// ─── Comments ────────────────────────────────────────────────────
export type CommentIntent = 'lead' | 'objection' | 'support' | 'spam';

export interface CommentRecord {
    id: EntityId;
    channel: ChannelName;
    campaignId: EntityId;
    authorName: string;
    body: string;
    timestamp: string;
}

export interface CommentQueueItem {
    commentId: EntityId;
    intent: CommentIntent;
    priority: number;
    comment: CommentRecord;
}

export interface ReplyDraft {
    id: EntityId;
    commentId: EntityId;
    body: string;
    confidence: number;
    policyApplied: string;
}

export interface ReplyPolicy {
    maxLength: number;
    tone: string;
    bannedPhrases: string[];
}

// ─── Strategy ────────────────────────────────────────────────────
export interface DiscoveryInterviewInput {
    businessName: string;
    industry: string;
    targetCustomer: string;
    currentOfferings: string[];
    painPoints: string[];
    competitiveAdvantage: string;
}

export interface DiscoveryInterview {
    id: EntityId;
    version: number;
    data: DiscoveryInterviewInput;
    capturedAt: string;
}

export interface OfferConstraints {
    maxHypotheses: number;
    channels: ChannelName[];
}

export interface OfferHypothesis {
    id: EntityId;
    name: string;
    angle: string;
    icp: string;
    rationale: string;
    confidence: number;
    rank?: number;
}

export interface MarketSignal {
    id: EntityId;
    source: string;
    content: string;
    relevance: number;
    collectedAt: string;
}

export interface OfferProfile {
    id: EntityId;
    hypothesis: OfferHypothesis;
    signals: MarketSignal[];
    state: ApprovalState;
}

export interface ResearchSourcePlan {
    allowedDomains: string[];
    maxRequests: number;
    strategy: 'api-first' | 'browser-fallback';
}

// ─── Style System ────────────────────────────────────────────────

/** Controls: tone, formality, CTA intensity, and compliance boundaries. */
export type TonePreset = 'professional' | 'casual' | 'urgent' | 'friendly' | 'authoritative';
export type CtaIntensity = 'soft' | 'medium' | 'hard';
export type EmojiPolicy = 'none' | 'sparse' | 'liberal';

export interface StyleProfile {
    id: EntityId;
    name: string;
    tone: TonePreset;
    /** 1 = very casual, 10 = very formal */
    formality: number;
    /** Target reading level (e.g. "8th grade", "professional") */
    readingLevel: string;
    ctaIntensity: CtaIntensity;
    bannedTerms: string[];
    requiredPhrases: string[];
    allowedClaims: string[];
    createdAt: string;
    updatedAt: string;
}

/** Per-channel tweaks that override or narrow global StyleProfile settings. */
export interface ChannelStyleOverride {
    channel: ChannelName;
    maxLength: number;
    emojiPolicy: EmojiPolicy;
    hashtagPolicy: 'none' | 'branded-only' | 'open';
    lineBreakPolicy: 'short-paragraphs' | 'single-block' | 'bullet-list';
}

/** Compiled prompt context: offer brief + style profile + channel overrides. */
export interface CampaignInstructionPack {
    campaignId: EntityId;
    styleProfileId: EntityId;
    channelOverrides: ChannelStyleOverride[];
    complianceRules: string[];
    compiledAt: string;
}

/** Policy-check result returned after validating generated copy against an instruction pack. */
export interface StyleViolation {
    rule: string;
    severity: 'hard' | 'soft';
    detail: string;
}

export interface GeneratedCopyAudit {
    variantId: EntityId;
    styleProfileId: EntityId;
    policyVersion: string;
    violations: StyleViolation[];
    /** 0-100 compliance score; 100 = no violations */
    score: number;
    passed: boolean;
}

// ─── Social Scout ────────────────────────────────────────────────

export type ScoutPlatform = 'reddit' | 'x' | 'facebook' | 'instagram' | 'linkedin';

export interface ScoutSourceConfig {
    id: EntityId;
    platform: ScoutPlatform;
    sourceId: string;
    query: string;
    enabled: boolean;
    scanIntervalMinutes: number;
}

export interface ScoutRun {
    id: EntityId;
    startedAt: string;
    completedAt?: string;
    platform: ScoutPlatform;
    status: 'running' | 'completed' | 'failed';
    itemsFound: number;
}

export interface OpportunityScoreBreakdown {
    keywordRelevance: number;
    engagementPotential: number;
    recency: number;
    riskPenalty: number;
}

export interface OpportunityItem {
    id: EntityId;
    platform: ScoutPlatform;
    sourceUrl: string;
    author: string;
    contentSnippet: string;
    /** Composite score 0-100 */
    score: number;
    scoreBreakdown: OpportunityScoreBreakdown;
    riskFlags: string[];
    discoveredAt: string;
}

export interface SuggestedEngagement {
    id: EntityId;
    opportunityId: EntityId;
    draftComment: string;
    toneProfile: TonePreset;
    confidence: number;
    policyChecks: string[];
}

export type OpportunityDecisionType = 'approved' | 'skipped' | 'muted';

export interface OpportunityDecision {
    opportunityId: EntityId;
    decision: OpportunityDecisionType;
    reviewerId: string;
    timestamp: string;
    notes?: string;
}

// ─── Preview Feed ────────────────────────────────────────────────

export interface PreviewPost {
    id: EntityId;
    channel: ChannelName;
    content: string;
    headline?: string;
    cta?: string;
    publishedAt: string;
    campaignId?: EntityId;
}

// ─── Analytics ───────────────────────────────────────────────────
export interface CampaignMetricRow {
    campaignId: EntityId;
    channel: ChannelName;
    impressions: number;
    clicks: number;
    leads: number;
    spend: number;
    revenue: number;
}

export interface AttributionSnapshot {
    campaignId: EntityId;
    totalSpend: number;
    totalRevenue: number;
    cpl: number;
    roas: number;
    byChannel: CampaignMetricRow[];
}

export interface ConversionFunnelRow {
    stage: FunnelStageName;
    entered: number;
    converted: number;
    rate: number;
}

export interface VariantPerformanceRow {
    variantId: EntityId;
    channel: ChannelName;
    impressions: number;
    clicks: number;
    conversions: number;
    score: number;
}

// ─── Events ──────────────────────────────────────────────────────
export type DomainEventName =
    | 'InterviewCaptured'
    | 'OfferHypothesesGenerated'
    | 'OfferProfileApproved'
    | 'CampaignDrafted'
    | 'FunnelPlanCreated'
    | 'VariantsGenerated'
    | 'VariantsScored'
    | 'ReviewBatchCreated'
    | 'AssetApproved'
    | 'AssetRejected'
    | 'PublishScheduled'
    | 'PublishDispatched'
    | 'CommentsIngested'
    | 'CommentClassified'
    | 'ReplyDrafted'
    | 'CommentReplied'
    | 'AttributionProjected'
    | 'StyleProfileCreated'
    | 'StyleProfileUpdated'
    | 'InstructionPackCompiled'
    | 'CopyAuditRun'
    | 'ScoutScanStarted'
    | 'ScoutScanCompleted'
    | 'OpportunityScored'
    | 'OpportunityDecided'
    | 'PreviewPostPublished';

export interface DomainEvent {
    id: EntityId;
    name: DomainEventName;
    entityId: EntityId;
    timestamp: string;
    payload: Record<string, unknown>;
}

// ─── Errors ──────────────────────────────────────────────────────
export interface AppError {
    code: string;
    message: string;
    module: string;
}

// ─── Validation ──────────────────────────────────────────────────
export interface ValidationResult {
    valid: boolean;
    errors: AppError[];
    normalized?: CampaignBrief;
}

// ─── Adapter Types ───────────────────────────────────────────────
export type AdapterName = ChannelName;

export interface AdapterPublishRequest {
    jobId: EntityId;
    channel: ChannelName;
    content: string;
    scheduledAt: string;
}

export interface AdapterPublishResponse {
    jobId: EntityId;
    channel: ChannelName;
    success: boolean;
    externalId?: string;
}

export interface AdapterCommentEvent {
    comment: CommentRecord;
    raw: Record<string, unknown>;
}

export interface ReplyPayload {
    replyId: EntityId;
    channel: ChannelName;
    commentId: EntityId;
    body: string;
}

export interface SendResult {
    replyId: EntityId;
    success: boolean;
    externalId?: string;
}
