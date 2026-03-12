# DATA_FLOW.md — GrowthOps OS

All flows below reflect actual shipped function names as of 2026-03-05.
In local/learning mode every step passes through `src/mock-engine.ts`, which
translates UI actions into calls to the `src/mock.ts` modules.
See the mock-engine note on each flow for translation details.

---

## Flow A: Campaign Launch

```
UI: Launch Console
  -> mock-engine.launchCampaign(briefId)          [mock mode]
  -> funnel.getBrief(briefId)
  -> copylab.generateVariants(request: CopyRequest)
  -> approvals.createReviewBatch(items)            -> ReviewBatch
  -> event-log.append(CampaignDrafted)
  -> read-models.refresh(CampaignStatus)
```

Data crossing boundaries:
- `BriefInput` (core)
- `CopyRequest` → `ChannelVariantSet` (core)
- `ReviewItemInput[]` → `ReviewBatch` (core)

Mock-engine note: `mock-engine.ts` calls `modules/copylab/src/mock.ts`
`generateVariants(brief, plan)` (two-argument form) and maps the result
before forwarding to `approvals.createReviewBatch`. The production path
uses the single-argument `generateVariants(request: CopyRequest)` shape.

---

## Flow B: Approval to Publishing

```
UI: Approval Queue
  -> approvals.decideReview(decision: ReviewDecision)   -> DecideReviewOutcome
  -> [if approved] event-log.append(AssetApproved)
  -> publishing.scheduleAsset(assetId, runAt, channel)  -> PublishCalendarEntry
  -> publishing.dispatchDue(now)                        -> PublishDispatchResult[]
  -> adapters.enqueuePublish(job)
  -> event-log.append(PublishScheduled | PublishDispatched)
  -> read-models.refresh(PublishCalendar)
```

Data crossing boundaries:
- `ReviewDecision` (core)
- `PublishCalendarEntry` (core)
- `PublishDispatchResult[]` (core)

Mock-engine note: `mock-engine.ts` calls `modules/approvals/src/mock.ts`
`decideReview(decision)` which shares the same `ReviewDecision` signature
as the production function. `modules/publishing/src/mock.ts`
`scheduleAsset(assetId, assetLabel, runAt, channel)` takes an extra
`assetLabel` parameter used for calendar display in the UI — this is
stripped before the record is returned to the UI read model. The gate
check `approvals.isApproved(itemId)` is called by publishing before any
dispatch proceeds.

---

## Flow C: Comment Operations

```
adapters.ingestComments(channel, campaignId)
  -> comments.triageComment(comment)                    -> CommentQueueItem
  -> comments.draftReply(item, policy)                  -> ReplyDraft
  -> approvals.createReviewBatch([replyItem])            -> ReviewBatch
  -> UI reviewer: approvals.decideReview(decision)      -> DecideReviewOutcome
  -> [if approved] comments.sendApprovedReply(replyId)  -> SendResult
  -> adapters.sendReply(reply)
  -> event-log.append(CommentReplied)
  -> read-models.refresh(CommentOpsDashboard)
```

Data crossing boundaries:
- `CommentRecord` (core)
- `CommentQueueItem` (core)
- `ReplyDraft` (core)
- `ReviewDecision` (core)
- `SendResult` (core)

Mock-engine note: `modules/comments/src/mock.ts` `draftReply(...)` may
return `null` for spam-classified comments. The mock-engine translation
layer in `mock-engine.ts` filters null drafts before forwarding to the
approval queue — the contract `draftReply` signature remains non-null
for the production domain API. `sendApprovedReply` in the production
implementation (`modules/comments/src/send.ts`) requires an additional
`context: ReplyDraftContext` parameter until a persistent reply store
is available to resolve drafts by id.

---

## Flow D: Attribution Projection

```
event-log.stream(campaignId)
  -> analytics.projectAttribution(events)               -> AttributionSnapshot
  -> analytics.projectFunnelConversion(events, planId)  -> ConversionFunnelRow[]
  -> analytics.projectVariantPerformance(events)        -> VariantPerformanceRow[]
  -> analytics.campaignDashboardReadModel(events, planId) -> CampaignDashboardReadModel
  -> UI telemetry appends LearningPageViewed / LearningActionTracked to the same mock event log
  -> UI: dashboard page renders read model, including learning engagement summary
```

Data crossing boundaries:
- `DomainEvent[]` (core)
- `AttributionSnapshot` (core)
- `ConversionFunnelRow[]` (core)
- `VariantPerformanceRow[]` (core)
- `CampaignDashboardReadModel` (analytics)

Mock-engine note: `modules/analytics/src/mock.ts` uses
`projectAttribution(events, campaignId)` — the extra `campaignId`
argument forces a deterministic single-campaign snapshot in offline
mode. The production function derives campaign identity from the event
stream. `campaignDashboardReadModel` consolidates all three projections
into one call for the UI read model.

---

## Flow E: Offer Discovery and Market Signals

```
UI: Strategy Workspace
  -> strategy.captureInterview(input)                   -> DiscoveryInterview
  -> strategy.generateOfferHypotheses(interview, constraints) -> OfferHypothesis[]
  -> adapters.collectMarketSignals(sourcePlan)           -> MarketSignal[]
  -> strategy.rankHypotheses(hypotheses, signals)        -> OfferHypothesis[]
  -> approvals.createReviewBatch([offerItem])            -> ReviewBatch
  -> UI reviewer: approvals.decideReview(decision)       -> DecideReviewOutcome
  -> [if approved] event-log.append(OfferProfileApproved)
  -> read-models.refresh(OfferReadiness)
```

Data crossing boundaries:
- `DiscoveryInterviewInput` → `DiscoveryInterview` (core)
- `OfferHypothesis[]` (core)
- `MarketSignal[]` (core)
- `ReviewDecision` (core)

Mock-engine note: `modules/strategy/src/mock.ts` exposes
`buildOfferProfile(hypothesis, signals): OfferProfile` — this helper is
intentionally mock-only for the workflow translation layer and is not
part of the formal module contract. The formal contract functions
`captureInterview`, `generateOfferHypotheses`, and `rankHypotheses`
are called directly in the production path.

Human-review gate: Offer hypotheses are advisory outputs from the Genkit
strategy agents. No offer profile is committed or published without an
explicit `approvals.decideReview` decision from a human reviewer.

---

## Flow F: Manual Research Loop and Opportunity Prioritization

```
Analyst/operator captures a signal in data/research/opportunities.seed.json
  -> social-scout rubric fields are filled (`urgency`, `repeatFrequency`, `buyerClarity`, `dataAvailability`, `localFirstAdvantage`)
  -> total score is stored in the local record
  -> UI: Opportunities Inbox renders repo-backed cards for manual review
  -> UI: dashboard page summarizes active records, average score, platform mix, and top opportunities
  -> human decides whether to keep researching, draft content, or move an item toward approvals
```

Data crossing boundaries:
- `ResearchOpportunityRecord[]` (file-backed local corpus)
- `ResearchOpportunityDashboardSummary` (dashboard UI summary)

Guardrail note: this flow is still local-first and advisory. Summaries help Chris decide what deserves attention; they do not create outbound actions, queue replies automatically, or replace review.
