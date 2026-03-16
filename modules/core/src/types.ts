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
    | 'task'
    | 'hyp'
    | 'sig'
    | 'prof'
    | 'int'
    | 'style'
    | 'srun'
    | 'opp'
    | 'eng'
    | 'dec'
    | 'prev'
    | 'cred';

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

export type ChannelName = 'meta' | 'linkedin' | 'x' | 'email' | 'instagram' | 'reddit' | 'tiktok' | 'youtube' | 'substack' | 'threads' | 'facebook' | 'pinterest';

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
    warnings?: string[];
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

// ─── Projects & Planning ─────────────────────────────────────────
export interface Project {
    id: string;            // UUID in prod, prefixed in mock
    name: string;
    status: 'active' | 'completed' | 'on_hold';
    description?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'done';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    projectId: string;     // FK → Project.id
    description?: string;
    dueDate?: string;      // ISO 8601
    assignee?: string;
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
    assetId: EntityId;
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
    | 'PreviewPostPublished'
    | 'LearningPageViewed'
    | 'LearningActionTracked'
    | 'ProjectCreated'
    | 'TaskCreated'
    | 'TaskStatusUpdated'
    | 'CredentialSet'
    | 'PlatformAvailabilityChecked';

export interface DomainEvent {
    id: EntityId;
    name: DomainEventName;
    entityId: EntityId;
    timestamp: string;
    payload: Record<string, unknown>;
}

// ─── Future Approval Workflow (P5) ───────────────────────────────

/**
 * ReviewAssignment — associates a reviewer with a review batch item and
 * tracks SLA compliance. Part of the P5 approval workflow overhaul.
 * DO NOT modify existing approval logic to use this type yet.
 */
export interface ReviewAssignment {
    /** ID of the ReviewItem this assignment belongs to. */
    itemId: EntityId;
    /** User identifier of the assigned reviewer. */
    assigneeId: string;
    /** ISO 8601 timestamp when the assignment was created. */
    assignedAt: string;
    /** SLA budget in minutes from assignedAt before the review is considered overdue. */
    slaMinutes: number;
}

/**
 * ReviewComment — a structured annotation left by a reviewer on a review item.
 * Part of the P5 approval workflow overhaul.
 */
export interface ReviewComment {
    /** Stable ID for this comment record. */
    id: EntityId;
    /** The item being commented on. */
    itemId: EntityId;
    /** User identifier of the commenter. */
    reviewerId: string;
    /** ISO 8601 timestamp the comment was created. */
    createdAt: string;
    /** Free-text body of the comment or revision instruction. */
    body: string;
    /** Optional revision notes providing specific change guidance. */
    revisionNotes?: string;
}

/**
 * ReviewDecisionAudit — immutable audit trail entry for every approval decision.
 * Part of the P5 approval workflow overhaul.
 */
export interface ReviewDecisionAudit {
    /** The item whose decision is being recorded. */
    itemId: EntityId;
    /** Reviewer who made the decision. */
    reviewerId: string;
    /** The decision that was made. */
    decision: 'approved' | 'rejected' | 'reopened';
    /** ISO 8601 timestamp of the decision. */
    decidedAt: string;
    /** Optional notes attached to this decision. */
    notes?: string;
    /** All audit entries for this item, ordered oldest-first. */
    auditEntries: Array<{
        decision: 'approved' | 'rejected' | 'reopened';
        reviewerId: string;
        decidedAt: string;
        notes?: string;
    }>;
}

// ─── Platform Credentials ───────────────────────────────────────
/**
 * PlatformCredential — holds a single platform API credential.
 * SECURITY: Values NEVER leave the adapters layer. The UI and domain
 * modules only ever see PlatformAvailability (boolean status), not tokens.
 * Adapter layer is the ONLY layer that reads .value.
 */
export type PlatformName = 'meta' | 'linkedin' | 'x' | 'email' | 'instagram' | 'reddit' | 'tiktok' | 'facebook' | 'youtube' | 'substack' | 'pinterest' | 'threads';

export interface PlatformCredential {
    /** Which platform this credential belongs to. */
    platform: PlatformName;
    /** Credential kind — controls which fields are expected. */
    kind: 'oauth_token' | 'api_key' | 'smtp';
    /** Opaque credential value. NEVER expose to UI or domain modules. */
    value: string;
    /** Optional secondary secret (e.g. OAuth token secret for X). */
    secret?: string;
    /** ISO 8601 expiry for OAuth tokens; absence means non-expiring. */
    expiresAt?: string;
}

/**
 * CredentialStore — a thin wrapper around a Map kept in the adapter layer.
 * Returned by getCredentialStore(); never serialised or returned to UI.
 */
export interface CredentialStore {
    get(platform: PlatformName): PlatformCredential | undefined;
    set(platform: PlatformName, cred: PlatformCredential): void;
    has(platform: PlatformName): boolean;
    clear(platform: PlatformName): void;
    clearAll(): void;
}

/**
 * PlatformAvailability — safe cross-layer status report.
 * This is the ONLY credential-related type allowed to cross into UI or mock-engine.
 * It carries NO token values, just boolean readiness per platform.
 */
export interface PlatformAvailability {
    platform: PlatformName;
    /** True when a valid credential is stored and not expired. */
    available: boolean;
    /** Human-readable reason for unavailability ("missing", "expired", "mock-safe"). */
    reason?: string;
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
