/**
 * Mock Engine - Translation layer between product UI and module code.
 * This is the ONLY file that imports module mock functions.
 * The UI only sees product-shaped data returned from here.
 */

import {
    resetIdCounter,
    EventLog,
    newEntityId,
} from '../modules/core/src/index';
import type {
    ApprovalState,
    AttributionSnapshot,
    CampaignBrief,
    ChannelName,
    ChannelVariantSet,
    CommentQueueItem,
    ConversionFunnelRow,
    CopyVariant,
    DiscoveryInterview,
    EntityId,
    FunnelPlan,
    MarketSignal,
    OfferHypothesis,
    OfferProfile,
    Project,
    PublishCalendarEntry,
    PublishDispatchResult,
    ReplyDraft,
    ReviewBatch,
    ReviewDecision,
    ReviewDecisionAudit,
    Task,
    TaskStatus,
    VariantPerformanceRow,
    VariantScore,
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
import { campaignDashboardReadModel } from '../modules/analytics/src/dashboard';

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
let sentReplyIds = new Set<EntityId>();

// ── Review notes & audit trail (REV-3, REV-5) ───────────────────────
let reviewNotes = new Map<string, string>();
let decisionAuditLog = new Map<string, ReviewDecisionAudit>();

// ── Projects & Planning state ──────────────────────────────────────
let _projects: Project[] = [];
let _tasks: Task[] = [];

function seedProjects(): void {
    if (_projects.length) return;
    _projects = [
        { id: 'P-1', name: 'Facebook Page Setup',   status: 'active', description: 'Create and configure business Facebook page' },
        { id: 'P-2', name: 'Brand Asset Prep',      status: 'active', description: 'Logo, cover photo, profile image, bio copy' },
        { id: 'P-3', name: 'Ad Account Config',     status: 'active', description: 'Set up Meta Business Suite, payment, pixel' },
    ];
    _tasks = [
        { id: 'T-1', title: 'Create Facebook Business Page',      status: 'todo',        projectId: 'P-1', description: 'Go to facebook.com/pages/create and follow the wizard' },
        { id: 'T-2', title: 'Set profile picture & cover photo',  status: 'todo',        projectId: 'P-1', assignee: 'operator' },
        { id: 'T-3', title: 'Write page About section',           status: 'todo',        projectId: 'P-1', description: 'Use brand voice from discovery interview' },
        { id: 'T-4', title: 'Prepare logo (1024×1024 PNG)',       status: 'in_progress', projectId: 'P-2', assignee: 'operator' },
        { id: 'T-5', title: 'Create cover image (1640×856)',      status: 'todo',        projectId: 'P-2' },
        { id: 'T-6', title: 'Write one-line bio',                 status: 'completed',   projectId: 'P-2' },
        { id: 'T-7', title: 'Create Meta Business Suite account', status: 'todo',        projectId: 'P-3' },
        { id: 'T-8', title: 'Connect payment method',             status: 'todo',        projectId: 'P-3' },
        { id: 'T-9', title: 'Install Meta Pixel on website',      status: 'todo',        projectId: 'P-3', description: 'Copy pixel code into site header, verify with Pixel Helper extension' },
    ];
}

export function getProjects(): Project[] {
    seedProjects();
    return _projects;
}

export function getTasks(): Task[] {
    seedProjects();
    return _tasks;
}

export function getTasksByProject(projectId: string): Task[] {
    return getTasks().filter((t) => t.projectId === projectId);
}

export function getTasksByStatus(status: TaskStatus): Task[] {
    return getTasks().filter((t) => t.status === status);
}

export function createProject(name: string, description?: string): Project {
    const project: Project = {
        id: newEntityId('plan'),
        name,
        status: 'active',
        description,
    };
    _projects.push(project);
    eventLog.append('ProjectCreated', project.id as EntityId);
    return project;
}

export function createTask(
    projectId: string,
    title: string,
    description?: string,
    assignee?: string,
    dueDate?: string,
): Task {
    const task: Task = {
        id: newEntityId('task'),
        title,
        status: 'todo',
        projectId,
        description,
        assignee,
        dueDate,
    };
    _tasks.push(task);
    eventLog.append('TaskCreated', task.id as EntityId);
    return task;
}

export function updateTaskStatus(taskId: string, newStatus: TaskStatus): void {
    const task = _tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    task.status = newStatus;
    eventLog.append('TaskStatusUpdated', task.id as EntityId, { status: newStatus });
}

export interface StarterPreset {
    id: string;
    icon: string;
    name: string;
    description: string;
    data: {
        businessName: string;
        industry: string;
        targetCustomer: string;
        currentOfferings: string[];
        painPoints: string[];
        competitiveAdvantage: string;
    };
}

export const STARTER_PRESETS: StarterPreset[] = [
    {
        id: 'design-agency',
        icon: 'Design',
        name: 'Design Agency',
        description: 'Brand identity and web design for small businesses',
        data: {
            businessName: 'Carta Creative Studio',
            industry: 'Design & Branding',
            targetCustomer: 'Small business owners who need a professional brand identity but do not know where to start',
            currentOfferings: ['Logo design', 'Brand identity packages', 'Website design', 'Social media templates'],
            painPoints: ['Looks unprofessional online', 'Losing clients to competitors with better branding', 'No consistent visual style across channels'],
            competitiveAdvantage: 'Fixed-price packages, fast 2-week turnaround, and a brand playbook every client keeps',
        },
    },
    {
        id: 'automation-company',
        icon: 'Automation',
        name: 'Automation Company',
        description: 'Business process automation for service businesses',
        data: {
            businessName: 'Streamline Ops',
            industry: 'Business Automation',
            targetCustomer: 'Service business owners spending 10+ hours a week on repetitive admin tasks',
            currentOfferings: ['Workflow automation audits', 'CRM setup and integration', 'Email and follow-up automation', 'Reporting dashboards'],
            painPoints: ['Too much time on manual data entry', 'Missed follow-ups losing deals', 'No visibility into what the team is doing'],
            competitiveAdvantage: 'Done-for-you implementation in 30 days with a money-back guarantee if time savings are not measurable',
        },
    },
    {
        id: 'local-service',
        icon: 'Service',
        name: 'Local Service Business',
        description: 'Home services serving a local area',
        data: {
            businessName: 'NextDay Home Services',
            industry: 'Home Services',
            targetCustomer: 'Homeowners who need reliable repairs fast without being overcharged',
            currentOfferings: ['Emergency plumbing', 'HVAC maintenance and repair', 'Water heater installation', 'Drain cleaning'],
            painPoints: ['Cannot find a trustworthy contractor', 'Waiting days for a callback', 'Unexpected charges at the end of the job'],
            competitiveAdvantage: 'Same-day service, upfront flat-rate pricing, and a 2-year parts-and-labour warranty',
        },
    },
];

let pendingPreset: StarterPreset | null = null;

type AdvisorySource = 'mock-engine' | 'genkit-mock' | 'genkit-live';
type AdvisoryPhase = 'suggested' | 'in-review' | 'approved' | 'rejected';
type PageKey = 'discovery' | 'launcher' | 'comments' | 'review';

export interface AdvisoryState {
    source: AdvisorySource;
    phase: AdvisoryPhase;
    title: string;
    summary: string;
    bullets: string[];
    lastUpdated: string;
}

export interface ReplyCoachState {
    source: AdvisorySource;
    phase: AdvisoryPhase;
    strategy: string;
    coachingNote: string;
    lastUpdated: string;
}

export interface PageNotice {
    type: 'info' | 'error';
    message: string;
}

interface Checklist {
    quality: boolean;
    safety: boolean;
    tone: boolean;
    factuality: boolean;
}

interface OfferStrategistOutput {
    coachMessage: string;
    hypotheses: Array<{
        name: string;
        angle: string;
        icp: string;
        rationale: string;
        confidence: number;
    }>;
    nextQuestion?: string;
    humanReviewRequired: boolean;
    evaluationChecklist: Checklist;
}

interface CopyCoachOutput {
    coachMessage: string;
    variants: Array<{
        channel: ChannelName;
        stage: 'awareness' | 'consideration' | 'decision';
        headline: string;
        body: string;
        cta: string;
        whyItWorks: string;
        characterCount: number;
    }>;
    copyLesson: string;
    humanReviewRequired: true;
    evaluationChecklist: Checklist;
}

interface ReplyCoachOutput {
    draftReply: string;
    strategyExplained: string;
    coachingNote: string;
    doNotSendAutomatically: true;
    characterCount: number;
    humanReviewRequired: true;
    evaluationChecklist: Checklist;
}

interface FlowSuccess<T> {
    ok: true;
    mode: 'live' | 'mock-safe';
    output: T;
}

interface FlowFailure {
    ok: false;
    error: string;
}

let discoveryAdvisory: AdvisoryState | null = null;
let launchAdvisory: AdvisoryState | null = null;
let commentsAdvisory: AdvisoryState | null = null;
let replyCoachStates = new Map<EntityId, ReplyCoachState>();
let pageNotices = new Map<PageKey, PageNotice>();
let commentsLoading = false;
let commentsAiAttempted = false;

const trackedPageViews = new Set<string>();


function advisorySource(mode: 'live' | 'mock-safe'): AdvisorySource {
    return mode === 'live' ? 'genkit-live' : 'genkit-mock';
}

function setPageNotice(page: PageKey, type: PageNotice['type'], message: string): void {
    pageNotices.set(page, { type, message });
}

function clearPageNotice(page: PageKey): void {
    pageNotices.delete(page);
}

function updateAdvisoryPhase(advisory: AdvisoryState | null, phase: AdvisoryPhase): AdvisoryState | null {
    if (!advisory) return advisory;
    return {
        ...advisory,
        phase,
        lastUpdated: new Date().toISOString(),
    };
}

function formatChecklist(checklist: Checklist): string[] {
    return [
        `Quality: ${checklist.quality ? 'pass' : 'needs review'}`,
        `Safety: ${checklist.safety ? 'pass' : 'needs review'}`,
        `Tone: ${checklist.tone ? 'pass' : 'needs review'}`,
        `Factuality: ${checklist.factuality ? 'pass' : 'needs review'}`,
    ];
}

function fallbackErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown flow error';
}

function normalizeReviewBatchResult(
    result: ReviewBatch | { ok: true; batch: ReviewBatch } | { ok: false; error?: { message?: string } },
): ReviewBatch {
    if ('items' in result) {
        return result;
    }

    if (result.ok) {
        return result.batch;
    }

    throw new Error(result.error?.message || 'Review batch creation failed.');
}

async function postFlow<T>(path: string, payload: unknown): Promise<FlowSuccess<T>> {
    const baseUrl = typeof window === 'undefined' ? 'http://localhost:3400' : '';
    const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const body = await response.json() as FlowSuccess<T> | FlowFailure;
    if (!response.ok || !body.ok) {
        throw new Error('error' in body ? body.error : `Flow request failed for ${path}`);
    }

    return body;
}

function createMockDiscoveryAdvisory(): AdvisoryState {
    return {
        source: 'mock-engine',
        phase: currentProfile ? 'approved' : 'suggested',
        title: 'Local strategy coach',
        summary: 'Using deterministic local offer guidance because the flow server is unavailable.',
        bullets: [
            `${currentHypotheses.length} ranked offer suggestions generated`,
            'Human review is still required before approving an offer.',
        ],
        lastUpdated: new Date().toISOString(),
    };
}

function createMockLaunchAdvisory(): AdvisoryState {
    return {
        source: 'mock-engine',
        phase: 'suggested',
        title: 'Local copy coach',
        summary: 'Using deterministic local copy generation while the flow server is unavailable.',
        bullets: [
            'Variant scoring remains deterministic and review-required.',
            'Nothing is published until you explicitly approve it.',
        ],
        lastUpdated: new Date().toISOString(),
    };
}

function createMockReplyCoachState(): ReplyCoachState {
    return {
        source: 'mock-engine',
        phase: 'suggested',
        strategy: 'Fallback reply guidance is coming from the local rule-based coach.',
        coachingNote: 'Review the draft before sending. Replies remain advisory until you approve them.',
        lastUpdated: new Date().toISOString(),
    };
}

function createMockCommentsAdvisory(): AdvisoryState {
    return {
        source: 'mock-engine',
        phase: currentReplies.length ? 'suggested' : 'approved',
        title: 'Local reply coach',
        summary: 'Comment drafts are currently coming from the local rule-based coach.',
        bullets: [
            `${currentReplies.length} draft replies ready for review`,
            'Spam comments remain non-reply items.',
            'Human approval is required before any reply is sent.',
        ],
        lastUpdated: new Date().toISOString(),
    };
}

function ensureReplyReviewItems(replies: ReplyDraft[]): void {
    if (!replies.length) {
        return;
    }

    const existingIds = new Set(approvals.getAllItems().map((item) => item.id));
    const pendingItems = replies
        .filter((reply) => !existingIds.has(reply.id))
        .map((reply) => {
            const comment = currentCommentItems.find((item) => item.commentId === reply.commentId);
            const author = comment?.comment.authorName || 'Unknown';
            return {
                id: reply.id,
                label: `Reply draft for ${author}`,
                kind: 'reply' as const,
            };
        });

    if (!pendingItems.length) {
        return;
    }

    const batch = normalizeReviewBatchResult(approvals.createReviewBatch(pendingItems));
    eventLog.append('ReviewBatchCreated', batch.id, {
        items: batch.items.length,
        kind: 'reply',
    });
}

export function submitDiscoveryInterview(input: {
    businessName: string;
    industry: string;
    targetCustomer: string;
    currentOfferings: string[];
    painPoints: string[];
    competitiveAdvantage: string;
}): DiscoveryInterview {
    currentInterview = strategy.captureInterview(input);
    currentHypotheses = [];
    currentSignals = [];
    currentProfile = null;
    discoveryAdvisory = null;
    clearPageNotice('discovery');
    eventLog.append('InterviewCaptured', currentInterview.id);
    return currentInterview;
}

export async function runDiscoveryInterview(input: {
    businessName: string;
    industry: string;
    targetCustomer: string;
    currentOfferings: string[];
    painPoints: string[];
    competitiveAdvantage: string;
}): Promise<DiscoveryInterview> {
    const interview = submitDiscoveryInterview(input);

    try {
        const flow = await postFlow<OfferStrategistOutput>('/api/flows/offer-strategist', {
            businessName: input.businessName,
            industry: input.industry,
            targetCustomer: input.targetCustomer,
            painPoints: input.painPoints,
            competitiveAdvantage: input.competitiveAdvantage,
            currentChannels: ['meta', 'linkedin', 'x'],
        });

        currentSignals = strategy.collectMarketSignals({
            allowedDomains: ['industry-trends.com', 'market-insights.io'],
            maxRequests: 5,
            strategy: 'api-first',
        });

        currentHypotheses = flow.output.hypotheses.map((hypothesis) => ({
            id: newEntityId('hyp'),
            name: hypothesis.name,
            angle: hypothesis.angle,
            icp: hypothesis.icp,
            rationale: hypothesis.rationale,
            confidence: hypothesis.confidence,
        }));
        currentHypotheses = strategy.rankHypotheses(currentHypotheses, currentSignals);
        discoveryAdvisory = {
            source: advisorySource(flow.mode),
            phase: 'suggested',
            title: 'AI offer coach',
            summary: flow.output.coachMessage,
            bullets: [
                ...(flow.output.nextQuestion ? [`Next question: ${flow.output.nextQuestion}`] : []),
                ...formatChecklist(flow.output.evaluationChecklist),
                'Human review is required before approving an offer.',
            ],
            lastUpdated: new Date().toISOString(),
        };
        clearPageNotice('discovery');
        eventLog.append('OfferHypothesesGenerated', interview.id, {
            count: currentHypotheses.length,
            source: discoveryAdvisory.source,
        });
    } catch (error) {
        getOfferSuggestions();
        setPageNotice(
            'discovery',
            'info',
            `AI server unavailable. Falling back to local offer guidance. ${fallbackErrorMessage(error)}`,
        );
    }

    return interview;
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
    discoveryAdvisory = createMockDiscoveryAdvisory();
    eventLog.append('OfferHypothesesGenerated', currentInterview.id, { count: currentHypotheses.length });
    return currentHypotheses;
}

export function approveOffer(hypothesisIndex: number): OfferProfile {
    const hypothesis = currentHypotheses[hypothesisIndex];
    if (!hypothesis) throw new Error('Invalid offer selection.');
    currentProfile = strategy.buildOfferProfile(hypothesis, currentSignals);
    currentProfile.state = 'approved';
    discoveryAdvisory = updateAdvisoryPhase(discoveryAdvisory, 'approved');
    eventLog.append('OfferProfileApproved', currentProfile.id);
    return currentProfile;
}

function createCampaignBase(input: {
    offerName: string;
    audience: string;
    channels: ChannelName[];
    goals: string[];
}): { brief: CampaignBrief; plan: FunnelPlan } {
    const result = validateCampaignBrief(input);
    if (!result.valid || !result.normalized) {
        throw new Error(result.errors.map((error) => error.message).join(', '));
    }

    currentBrief = result.normalized;
    currentPlan = funnel.createFunnelPlan(currentBrief);
    currentVariants = null;
    currentScores = [];
    currentCommentItems = [];
    currentReplies = [];
    sentReplyIds.clear();
    commentsLoading = false;
    commentsAiAttempted = false;
    trackedPageViews.clear();
    replyCoachStates.clear();
    commentsAdvisory = null;
    launchAdvisory = null;
    clearPageNotice('launcher');
    clearPageNotice('comments');
    clearPageNotice('review');

    eventLog.append('CampaignDrafted', currentBrief.id);
    eventLog.append('FunnelPlanCreated', currentPlan.id);

    return {
        brief: currentBrief,
        plan: currentPlan,
    };
}

function finalizeCampaign(variantSet: ChannelVariantSet, advisory: AdvisoryState) {
    currentVariants = variantSet;
    eventLog.append('VariantsGenerated', currentBrief!.id, { count: currentVariants.variants.length });
    currentScores = copylab.scoreVariants(currentVariants);
    eventLog.append('VariantsScored', currentBrief!.id);
    launchAdvisory = advisory;

    return {
        brief: currentBrief!,
        plan: currentPlan!,
        variants: currentVariants,
        scores: currentScores,
    };
}

async function buildFlowVariantSet(brief: CampaignBrief, plan: FunnelPlan): Promise<{
    variantSet: ChannelVariantSet;
    advisory: AdvisoryState;
}> {
    const outputs = await Promise.all(
        plan.stages.map(async (stage) => {
            const flow = await postFlow<CopyCoachOutput>('/api/flows/copy-coach', {
                briefId: brief.id,
                offerName: brief.offerName,
                audience: brief.audience,
                channels: stage.channels,
                funnelStage: stage.name,
                cta: stage.ctas[0] || 'Learn more',
            });
            return {
                source: advisorySource(flow.mode),
                output: flow.output,
            };
        }),
    );

    const source = outputs[0]?.source ?? 'genkit-mock';
    const variants: CopyVariant[] = outputs.flatMap(({ output }) =>
        output.variants.map((variant) => ({
            id: newEntityId('var'),
            channel: variant.channel,
            stage: variant.stage,
            headline: variant.headline,
            body: variant.body,
            cta: variant.cta,
            policyVersion: `${source}-v1`,
        })),
    );

    const lessons = Array.from(new Set(outputs.map(({ output }) => output.copyLesson)));

    return {
        variantSet: {
            briefId: brief.id,
            policyVersion: `${source}-v1`,
            variants,
        },
        advisory: {
            source,
            phase: 'suggested',
            title: 'AI copy coach',
            summary: outputs[0]?.output.coachMessage || 'AI-assisted copy suggestions are ready for review.',
            bullets: [
                ...lessons,
                'Review is required before any asset can be sent to publishing.',
            ],
            lastUpdated: new Date().toISOString(),
        },
    };
}

export async function createCampaignWithAdvisory(input: {
    offerName: string;
    audience: string;
    channels: ChannelName[];
    goals: string[];
}): Promise<{ brief: CampaignBrief; plan: FunnelPlan; variants: ChannelVariantSet; scores: VariantScore[] }> {
    const { brief, plan } = createCampaignBase(input);

    try {
        const result = await buildFlowVariantSet(brief, plan);
        clearPageNotice('launcher');
        return finalizeCampaign(result.variantSet, result.advisory);
    } catch (error) {
        const variantSet = copylab.generateVariants(brief, plan);
        setPageNotice(
            'launcher',
            'info',
            `AI server unavailable. Falling back to local copy generation. ${fallbackErrorMessage(error)}`,
        );
        return finalizeCampaign(variantSet, createMockLaunchAdvisory());
    }
}

export function createCampaign(input: {
    offerName: string;
    audience: string;
    channels: ChannelName[];
    goals: string[];
}): { brief: CampaignBrief; plan: FunnelPlan; variants: ChannelVariantSet; scores: VariantScore[] } {
    const { brief, plan } = createCampaignBase(input);
    const variantSet = copylab.generateVariants(brief, plan);
    return finalizeCampaign(variantSet, createMockLaunchAdvisory());
}

export function sendToReview(): ReviewBatch {
    if (!currentVariants) throw new Error('Generate copy first.');
    const items = currentVariants.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.channel} - ${variant.stage} - ${variant.headline.slice(0, 40)}...`,
        kind: 'asset' as const,
    }));
    const batch = normalizeReviewBatchResult(approvals.createReviewBatch(items));
    launchAdvisory = updateAdvisoryPhase(launchAdvisory, 'in-review');
    eventLog.append('ReviewBatchCreated', batch.id, { items: batch.items.length });
    return batch;
}

function syncApprovalPhase(itemId: EntityId): void {
    const items = approvals.getAllItems();
    const allApproved = items.length > 0 && items.every((item) => item.state === 'approved');

    if (currentVariants?.variants.some((variant) => variant.id === itemId)) {
        launchAdvisory = updateAdvisoryPhase(launchAdvisory, allApproved ? 'approved' : 'in-review');
    }

    if (currentReplies.some((reply) => reply.id === itemId)) {
        commentsAdvisory = updateAdvisoryPhase(commentsAdvisory, allApproved ? 'approved' : 'in-review');
    }
}

export function approveItem(itemId: EntityId): void {
    const item = approvals.getAllItems().find((entry) => entry.id === itemId);
    if (!item) {
        const message = `Approval item ${itemId} was not found in the review queue.`;
        setPageNotice('review', 'error', message);
        if (currentReplies.some((reply) => reply.id === itemId)) {
            setPageNotice('comments', 'error', message);
        }
        return;
    }

    const decision: ReviewDecision = {
        itemId,
        decision: 'approved',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
        note: reviewNotes.get(itemId),
    };
    approvals.decideReview(decision);
    if (!approvals.isApproved(itemId)) {
        const message = `Approval failed for ${item.label}.`;
        setPageNotice('review', 'error', message);
        if (item.kind === 'reply') {
            setPageNotice('comments', 'error', message);
        }
        return;
    }

    appendAuditEntry(itemId, 'approved', reviewNotes.get(itemId));
    syncApprovalPhase(itemId);
    setPageNotice('review', 'info', 'Item approved. It can now move to the next step.');
    if (item.kind === 'reply') {
        const reply = currentReplies.find((entry) => entry.id === itemId);
        if (reply) {
            const currentState = replyCoachStates.get(reply.commentId);
            if (currentState) {
                replyCoachStates.set(reply.commentId, {
                    ...currentState,
                    phase: 'approved',
                    lastUpdated: new Date().toISOString(),
                });
            }
        }
        setPageNotice('comments', 'info', 'Reply approved. You can send it now.');
    }
    eventLog.append('AssetApproved', itemId);
}

export function rejectItem(itemId: EntityId): void {
    const item = approvals.getAllItems().find((entry) => entry.id === itemId);
    if (!item) {
        const message = `Approval item ${itemId} was not found in the review queue.`;
        setPageNotice('review', 'error', message);
        if (currentReplies.some((reply) => reply.id === itemId)) {
            setPageNotice('comments', 'error', message);
        }
        return;
    }

    const decision: ReviewDecision = {
        itemId,
        decision: 'rejected',
        reviewerId: 'operator',
        timestamp: new Date().toISOString(),
        note: reviewNotes.get(itemId),
    };
    approvals.decideReview(decision);
    if (approvals.isApproved(itemId)) {
        const message = `Reject failed for ${item.label}.`;
        setPageNotice('review', 'error', message);
        if (item.kind === 'reply') {
            setPageNotice('comments', 'error', message);
        }
        return;
    }

    appendAuditEntry(itemId, 'rejected', reviewNotes.get(itemId));
    syncApprovalPhase(itemId);
    setPageNotice('review', 'info', 'Item rejected. It will stay out of publishing until revised.');
    if (item.kind === 'reply') {
        const reply = currentReplies.find((entry) => entry.id === itemId);
        if (reply) {
            const currentState = replyCoachStates.get(reply.commentId);
            if (currentState) {
                replyCoachStates.set(reply.commentId, {
                    ...currentState,
                    phase: 'rejected',
                    lastUpdated: new Date().toISOString(),
                });
            }
        }
        setPageNotice('comments', 'info', 'Reply discarded. It will not be sent.');
    }
    eventLog.append('AssetRejected', itemId);
}

export function approveAll(): void {
    const pending = approvals.getPendingItems();
    pending.forEach((item) => approveItem(item.id));
    setPageNotice('review', 'info', `${pending.length} item(s) approved.`);
}

export function rejectAll(): void {
    const pending = approvals.getPendingItems();
    pending.forEach((item) => rejectItem(item.id));
    setPageNotice('review', 'info', `${pending.length} item(s) rejected.`);
}

export function getReviewItems() {
    return approvals.getAllItems();
}

// ── Review Notes API (REV-3) ────────────────────────────────────────────────
export function setReviewNote(itemId: string, note: string): void {
    if (note.trim()) {
        reviewNotes.set(itemId, note.trim());
    } else {
        reviewNotes.delete(itemId);
    }
}

export function getReviewNote(itemId: string): string {
    return reviewNotes.get(itemId) || '';
}

// ── Decision Audit Trail API (REV-5) ────────────────────────────────────────
function appendAuditEntry(
    itemId: EntityId,
    decision: 'approved' | 'rejected',
    note?: string,
): void {
    const existing = decisionAuditLog.get(itemId);
    const entry = {
        decision,
        reviewerId: 'operator',
        decidedAt: new Date().toISOString(),
        notes: note || reviewNotes.get(itemId),
    };
    if (existing) {
        existing.decision = decision;
        existing.decidedAt = entry.decidedAt;
        existing.notes = entry.notes;
        existing.auditEntries.push(entry);
    } else {
        decisionAuditLog.set(itemId, {
            itemId,
            reviewerId: 'operator',
            decision,
            decidedAt: entry.decidedAt,
            notes: entry.notes,
            auditEntries: [entry],
        });
    }
}

export function getDecisionAudit(itemId: string): ReviewDecisionAudit | null {
    return decisionAuditLog.get(itemId) || null;
}

export function scheduleAll(): PublishCalendarEntry[] {
    if (!currentVariants) return [];

    const now = new Date();
    return currentVariants.variants.map((variant, index) => {
        const runAt = new Date(now.getTime() + (index + 1) * 3600_000).toISOString();
        const entry = publishing.scheduleAsset(variant.id, `${variant.channel} - ${variant.stage}`, runAt, variant.channel);
        eventLog.append('PublishScheduled', entry.jobId);
        return entry;
    });
}

export function publishNow(): PublishDispatchResult[] {
    const future = new Date(Date.now() + 86400_000 * 30).toISOString();
    const results = publishing.dispatchDue(future);
    results.forEach((result) => eventLog.append('PublishDispatched', result.jobId));
    return results;
}

export function getCalendar() {
    return publishing.getCalendar();
}

export function getPublishHistory() {
    return publishing.getCalendar()
        .slice()
        .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime())
        .slice(0, 10);
}

function loadMockComments(): CommentQueueItem[] {
    if (!currentBrief) throw new Error('Create a campaign first.');

    const raw = adapters.ingestComments('meta', currentBrief.id);
    eventLog.append('CommentsIngested', currentBrief.id, { count: raw.length });

    currentCommentItems = raw.map((event) => {
        const item = comments.triageComment(event.comment);
        eventLog.append('CommentClassified', item.commentId, { intent: item.intent });
        return item;
    });

    const policy = comments.getDefaultReplyPolicy();
    currentReplies = currentCommentItems
        .map((item) => comments.draftReply(item, policy))
        .filter((reply): reply is ReplyDraft => reply !== null);
    ensureReplyReviewItems(currentReplies);

    replyCoachStates.clear();
    currentReplies.forEach((reply) => {
        replyCoachStates.set(reply.commentId, createMockReplyCoachState());
        eventLog.append('ReplyDrafted', reply.id);
    });

    commentsAdvisory = createMockCommentsAdvisory();
    return currentCommentItems;
}

export function pullComments(): CommentQueueItem[] {
    if (currentCommentItems.length) {
        return currentCommentItems;
    }
    return loadMockComments();
}

export async function ensureCommentsLoaded(): Promise<CommentQueueItem[]> {
    if (!currentBrief) throw new Error('Create a campaign first.');
    if (commentsLoading) return currentCommentItems;
    if (!currentCommentItems.length) loadMockComments();
    if (commentsAiAttempted) return currentCommentItems;

    commentsLoading = true;

    try {
        const policy = comments.getDefaultReplyPolicy();
        const nextReplies: ReplyDraft[] = [];
        const nextCoachStates = new Map<EntityId, ReplyCoachState>();
        let firstSource: AdvisorySource | null = null;

        for (const item of currentCommentItems) {
            if (item.intent === 'spam') {
                continue;
            }

            try {
                const flow = await postFlow<ReplyCoachOutput>('/api/flows/reply-coach', {
                    commentId: item.commentId,
                    commentText: item.comment.body,
                    commentAuthor: item.comment.authorName,
                    intent: item.intent,
                    channel: item.comment.channel,
                    offerContext: currentProfile?.hypothesis.name || currentBrief.offerName,
                    tone: policy.tone,
                });

                const source = advisorySource(flow.mode);
                if (!firstSource) firstSource = source;
                const confidence = flow.output.evaluationChecklist.quality && flow.output.evaluationChecklist.tone ? 0.88 : 0.72;
                const reply: ReplyDraft = {
                    id: newEntityId('reply'),
                    commentId: item.commentId,
                    body: flow.output.draftReply,
                    confidence,
                    policyApplied: policy.tone,
                };
                nextReplies.push(reply);
                nextCoachStates.set(item.commentId, {
                    source,
                    phase: 'suggested',
                    strategy: flow.output.strategyExplained,
                    coachingNote: flow.output.coachingNote,
                    lastUpdated: new Date().toISOString(),
                });
            } catch {
                const fallbackReply = comments.draftReply(item, policy);
                if (fallbackReply) {
                    nextReplies.push(fallbackReply);
                    nextCoachStates.set(item.commentId, createMockReplyCoachState());
                }
            }
        }

        if (nextReplies.length > 0) {
            currentReplies = nextReplies;
            ensureReplyReviewItems(currentReplies);
            replyCoachStates = nextCoachStates;
            currentReplies.forEach((reply) => eventLog.append('ReplyDrafted', reply.id));
            commentsAdvisory = {
                source: firstSource ?? 'mock-engine',
                phase: 'suggested',
                title: firstSource ? 'AI reply coach' : 'Local reply coach',
                summary: firstSource
                    ? 'Reply drafts were upgraded with the Genkit reply coach. Review each draft before sending.'
                    : 'Reply drafts are still coming from the local rule-based coach.',
                bullets: [
                    `${currentReplies.length} reply draft(s) ready for review`,
                    'Every reply remains advisory until you approve it.',
                ],
                lastUpdated: new Date().toISOString(),
            };
            clearPageNotice('comments');
        }
    } catch (error) {
        setPageNotice(
            'comments',
            'info',
            `AI reply coach unavailable. Keeping local rule-based replies. ${fallbackErrorMessage(error)}`,
        );
    } finally {
        commentsLoading = false;
        commentsAiAttempted = true;
    }

    return currentCommentItems;
}

export function getCommentItems(): CommentQueueItem[] {
    return currentCommentItems;
}

export function isCommentsLoading(): boolean {
    return commentsLoading;
}

export function getCommentReplies(): ReplyDraft[] {
    return currentReplies;
}

export function getReplyCoachState(commentId: EntityId): ReplyCoachState | null {
    return replyCoachStates.get(commentId) || null;
}

function getReplyReviewItem(replyId: EntityId) {
    return approvals.getAllItems().find((entry) => entry.id === replyId && entry.kind === 'reply') || null;
}

export function getReplyReviewState(replyId: EntityId): ApprovalState | 'missing' {
    return getReplyReviewItem(replyId)?.state || 'missing';
}

export function isReplySent(replyId: EntityId): boolean {
    return sentReplyIds.has(replyId);
}

export function approveReply(replyId: EntityId): void {
    approveItem(replyId);
}

export function discardReply(replyId: EntityId): void {
    rejectItem(replyId);
}

export function explainReplyEditUnavailable(replyId: EntityId): void {
    const reply = currentReplies.find((entry) => entry.id === replyId);
    const item = reply ? currentCommentItems.find((entry) => entry.commentId === reply.commentId) : null;
    setPageNotice(
        'comments',
        'info',
        item
            ? `Inline editing is not wired yet for ${item.comment.authorName}'s reply. Use the review queue for approve/reject decisions until the editor lands.`
            : 'Inline editing is not wired yet. Use the review queue for approve/reject decisions until the editor lands.',
    );
}

export function sendReply(replyId: EntityId, options: { autoApprove?: boolean } = {}): boolean {
    const reply = currentReplies.find((entry) => entry.id === replyId);
    if (!reply) {
        setPageNotice('comments', 'error', `Reply ${replyId} was not found.`);
        return false;
    }

    if (sentReplyIds.has(replyId)) {
        setPageNotice('comments', 'info', 'That reply was already sent.');
        return true;
    }

    const currentState = getReplyReviewState(replyId);
    if (currentState === 'rejected') {
        setPageNotice('comments', 'info', 'Discarded replies stay out of send actions until you re-approve them from the review queue.');
        return false;
    }

    if (options.autoApprove !== false && currentState === 'pending') {
        approveItem(replyId);
    }

    if (!approvals.isApproved(replyId)) {
        setPageNotice('comments', 'error', 'This reply still needs approval before it can be sent.');
        return false;
    }

    const result = comments.sendApprovedReply(replyId);
    if (!result.success) {
        setPageNotice('comments', 'error', 'A reply could not be sent because it was not approved.');
        return false;
    }

    sentReplyIds.add(replyId);
    commentsAdvisory = updateAdvisoryPhase(commentsAdvisory, 'approved');
    setPageNotice('comments', 'info', 'Reply approved and sent.');
    eventLog.append('CommentReplied', reply.id, { externalId: result.externalId });
    return true;
}

export function sendReplies(): void {
    let sentCount = 0;
    let skippedCount = 0;

    currentReplies.forEach((reply) => {
        if (sendReply(reply.id)) {
            sentCount += 1;
        } else if (!sentReplyIds.has(reply.id)) {
            skippedCount += 1;
        }
    });

    if (sentCount > 0 && skippedCount === 0) {
        commentsAdvisory = updateAdvisoryPhase(commentsAdvisory, 'approved');
        setPageNotice('comments', 'info', `${sentCount} reply(s) approved and sent.`);
    } else if (sentCount > 0) {
        commentsAdvisory = updateAdvisoryPhase(commentsAdvisory, 'in-review');
        setPageNotice('comments', 'info', `${sentCount} reply(s) sent. ${skippedCount} discarded or blocked reply(s) were left untouched.`);
    } else if (skippedCount > 0) {
        commentsAdvisory = updateAdvisoryPhase(commentsAdvisory, 'in-review');
        setPageNotice('comments', 'info', `${skippedCount} reply(s) were left untouched because they are discarded, already sent, or still blocked.`);
    }
}


export function trackPageView(pageId: string): void {
    if (trackedPageViews.has(pageId)) return;
    trackedPageViews.add(pageId);
    eventLog.append('LearningPageViewed', newEntityId('item'), { pageId });
}

export function trackLearningAction(action: string, pageId: string, detail: Record<string, unknown> = {}): void {
    eventLog.append('LearningActionTracked', newEntityId('item'), { action, pageId, ...detail });
}

export function getDashboard(): {
    attribution: AttributionSnapshot;
    funnel: ConversionFunnelRow[];
    variants: VariantPerformanceRow[];
    learning: ReturnType<typeof campaignDashboardReadModel>['learning'];
} {
    const campaignId = currentBrief?.id || ('' as EntityId);
    const planId = currentPlan?.id || ('' as EntityId);
    const events = [...eventLog.all()];

    const readModel = campaignDashboardReadModel(events, planId);

    return {
        attribution: analytics.projectAttribution(events, campaignId),
        funnel: analytics.projectFunnelConversion(events, planId),
        variants: analytics.projectVariantPerformance(events),
        learning: readModel.learning,
    };
}

/**
 * getDashboardTrends — DASH-2
 * Returns 7 deterministic mock data points (one per day for the past week)
 * for each key campaign metric. Used to render sparklines on the dashboard.
 * Values are intentionally static so the UI is stable in mock mode.
 */
export function getDashboardTrends(): {
    cpl: number[];
    roas: number[];
    spend: number[];
    revenue: number[];
} {
    return {
        // CPL: downward trend is good (cost per lead decreasing)
        cpl: [18.40, 17.20, 16.80, 15.50, 14.90, 14.10, 13.50],
        // ROAS: upward trend (revenue multiplier improving)
        roas: [2.2, 2.5, 2.8, 2.9, 3.1, 3.0, 3.2],
        // Spend: steady ramp-up over the week
        spend: [160, 175, 185, 190, 200, 195, 210],
        // Revenue: growing faster than spend (improving efficiency)
        revenue: [352, 437, 518, 551, 620, 585, 672],
    };
}


export function getDiscoveryAdvisory(): AdvisoryState | null {
    return discoveryAdvisory;
}

export function getLaunchAdvisory(): AdvisoryState | null {
    return launchAdvisory;
}

export function getCommentsAdvisory(): AdvisoryState | null {
    return commentsAdvisory;
}

export function getPageNotice(page: PageKey): PageNotice | null {
    return pageNotices.get(page) || null;
}

export function clearPageMessage(page: PageKey): void {
    clearPageNotice(page);
}

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
    sentReplyIds.clear();
    pendingPreset = null;
    discoveryAdvisory = null;
    launchAdvisory = null;
    commentsAdvisory = null;
    replyCoachStates.clear();
    pageNotices.clear();
    commentsLoading = false;
    commentsAiAttempted = false;
    trackedPageViews.clear();
    _projects = [];
    _tasks = [];
    reviewNotes.clear();
    decisionAuditLog.clear();
}

export function getStarterPresets(): StarterPreset[] {
    return STARTER_PRESETS;
}

export function loadStarterPreset(presetId: string): StarterPreset | null {
    const preset = STARTER_PRESETS.find((item) => item.id === presetId) || null;
    pendingPreset = preset;
    return preset;
}

export function getPendingPreset(): StarterPreset | null {
    return pendingPreset;
}

export function clearPendingPreset(): void {
    pendingPreset = null;
}


// ── Style Profile State (PP-9) ────────────────────────────────────────────
let _selectedStyleProfile: string | null = null;

export function getStyleProfiles(): Array<{ id: string; name: string; description: string }> {
    return [
        { id: 'professional', name: 'Professional', description: 'Clear, credible, results-focused' },
        { id: 'casual',       name: 'Casual',       description: 'Friendly, approachable, conversational' },
        { id: 'urgent',       name: 'Urgent',       description: 'Action-oriented, time-sensitive' },
    ];
}

export function setSelectedStyleProfile(profileId: string | null): void {
    _selectedStyleProfile = profileId;
}

export function getSelectedStyleProfile(): string | null {
    return _selectedStyleProfile;
}

// Aliases matching projects.ts call sites (PP-9)
export const getCurrentStyleProfile = getSelectedStyleProfile;
export const setCurrentStyleProfile = setSelectedStyleProfile;

// ── Generate Project Plan (PP-5) ─────────────────────────────────────────────
/**
 * Creates a set of ready-to-use projects and tasks based on the current
 * discovery interview (or generic defaults if no interview is available).
 * Each project/task is created via createProject()/createTask() so domain
 * events fire and the Kanban board updates immediately.
 */
export function generateProjectPlan(): { projects: number; tasks: number } {
    seedProjects(); // ensure state is initialised

    const businessName = currentInterview?.data.businessName || null;
    const prefix       = businessName ? `${businessName} — ` : '';

    const plan: Array<{ name: string; description: string; tasks: string[] }> = businessName
        ? [
            {
                name:        `${prefix}Facebook Page Setup`,
                description: 'Create and configure the business Facebook page end-to-end.',
                tasks: [
                    'Create Facebook Business Page',
                    'Upload profile photo and cover image',
                    'Write the About section using brand voice',
                    'Add contact details and business hours',
                    'Enable page messaging',
                ],
            },
            {
                name:        `${prefix}Brand Assets`,
                description: 'Prepare all visual assets needed for campaign launch.',
                tasks: [
                    'Finalise logo (1024×1024 PNG)',
                    'Create cover image (1640×856 px)',
                    'Write one-line bio for each channel',
                    'Export brand colour hex values and fonts',
                ],
            },
            {
                name:        `${prefix}Ad Account Setup`,
                description: 'Configure Meta Business Suite, payment, and tracking.',
                tasks: [
                    'Create Meta Business Suite account',
                    'Connect payment method',
                    'Install Meta Pixel on website',
                    'Verify Pixel with Meta Pixel Helper',
                    'Grant ad account access to agency (if applicable)',
                ],
            },
        ]
        : [
            {
                name:        'Social Media Setup',
                description: 'Create and configure all required social accounts.',
                tasks: [
                    'Create Facebook Business Page',
                    'Set up LinkedIn Company Page',
                    'Create X (Twitter) business account',
                ],
            },
            {
                name:        'Content Pipeline',
                description: 'Build the content production system for the campaign.',
                tasks: [
                    'Define content calendar structure',
                    'Create post templates for each channel',
                    'Set up approval workflow',
                ],
            },
            {
                name:        'Analytics Setup',
                description: 'Install and verify tracking before campaign launches.',
                tasks: [
                    'Install tracking pixels',
                    'Set up UTM parameter structure',
                    'Configure dashboard reporting',
                ],
            },
        ];

    let projectCount = 0;
    let taskCount    = 0;

    for (const item of plan) {
        const project = createProject(item.name, item.description);
        projectCount++;
        for (const title of item.tasks) {
            createTask(project.id, title);
            taskCount++;
        }
    }

    return { projects: projectCount, tasks: taskCount };
}
