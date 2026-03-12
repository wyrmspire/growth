# future.md

## Purpose
This document defines how to implement the next major capabilities for GrowthOps OS:
1. Robust post style/instruction controls
2. Approval workflow that can route decisions through collaboration tools
3. Campaign scheduling and calendar execution
4. Slack and Office 365 integrations
5. Genkit flow integration for guided writing/coaching
6. Social opportunity scout for slow, rated comment opportunities

It also defines exactly which docs must be updated so code and docs stay aligned.

## Short Answer
Yes, this system can do "send post for approval" and "show campaign schedule" and can evolve into real Slack/Office 365 workflows.
No, it does not yet have a robust style instruction system. That is planned below.
Yes, it can be extended to slowly scan approved social sources and return "good places to comment" with suggested replies for human approval.

## Current Baseline (as of 2026-03-05)
- Mock engine and guided pages exist in `src/`.
- Core domain mock implementations exist in `modules/*/src/mock.ts`.
- Board-driven task system exists in `board.md`.
- Docs stack exists (`PRODUCT_DESIGN`, `MVP_SCOPE`, `SYSTEM_ARCHITECTURE`, `DATA_FLOW`, `PROJECT_RULES`, per-module contracts).
- Real provider adapters and real auth are not implemented.

## Future Capability 1: Robust Style and Instructions System

### Goal
Give operator-level control over writing style so generated posts match brand voice and campaign intent.

### Product Requirements
- Operator can define global style profile and per-campaign overrides.
- Operator can define channel-specific styles (Meta, LinkedIn, X, Email).
- Operator can define banned claims and compliance constraints.
- Operator can define CTA style (soft/medium/strong).
- Operator can preview style effect before generating full campaign copy.

### Data Model
Add new types in `modules/core` and `modules/copylab`:
- `StyleProfile`
  - `id`, `name`, `tone`, `formality`, `clarity`, `ctaIntensity`, `readingLevel`
  - `bannedTerms[]`, `requiredPhrases[]`, `allowedClaims[]`
- `ChannelStyleOverride`
  - `channel`, `maxLength`, `emojiPolicy`, `hashtagPolicy`, `lineBreakPolicy`
- `CampaignInstructionPack`
  - `campaignId`, `styleProfileId`, `channelOverrides[]`, `complianceRules[]`
- `GeneratedCopyAudit`
  - `variantId`, `styleProfileId`, `policyVersion`, `violations[]`, `score`

### UI Requirements
Add a new UI surface: `Style Studio`
- Global style controls:
  - tone preset, formality slider, CTA intensity slider
- Compliance controls:
  - banned phrases, required disclaimers, regulated claims toggle
- Channel tabs with overrides
- "Test output" panel showing one sample post per channel
- "Save profile" and "Apply to campaign" actions

### Engine Requirements
- Add `copylab.buildInstructionPack()` and `copylab.validateAgainstStylePack()`.
- Generate copy only through instruction-pack pipeline.
- Return violation list with each variant.
- Prevent approval if hard policy violations exist.

### Non-Functional Requirements
- Deterministic mock-mode behavior for repeatability.
- Clear explanation for each violation.
- Human-edit path always available.

## Future Capability 2: Approval Workflow with Real Collaboration Hooks

### Goal
Move from local approval queue to team-aware review with optional Slack/Office routing.

### Workflow Model
`draft -> pending_review -> approved | rejected -> scheduled -> published`

### Required Features
- Review batches grouped by campaign and channel.
- Reviewer assignment and SLA timer.
- Approval comments and revision reasons.
- Bulk approve/reject actions.
- Audit trail for all review decisions.

### Slack Path
- Notify review channel when batch is ready.
- Include summary plus deep-link back to app.
- Optional interactive approve/reject actions (phase 2 for Slack).

### Office 365 Path
- Send approval digest via Outlook (Graph API).
- Optional calendar hold for campaign launch windows.
- Optional Teams notification webhook.

### Data Additions
- `ReviewAssignment`, `ReviewComment`, `ReviewDecisionAudit`.
- `NotificationDispatch` with source and status.

## Future Capability 3: Scheduling and Campaign Calendar

### Goal
Provide accurate, timezone-safe campaign scheduling and publish visibility.

### Required Features
- Daily/weekly schedule windows.
- Timezone normalization (store UTC, display local).
- Per-channel posting windows and blackout periods.
- Queue state for scheduled, dispatched, failed, retried.
- Calendar views: day/week/list.

### Engine Behavior
- `publishing.scheduleAsset()` validates:
  - approved state
  - valid timestamp
  - channel window compliance
- `publishing.dispatchDue(now)` must be idempotent by job id.
- Retry policy with exponential backoff for transient adapter failures.

### Calendar UX
- Filter by campaign, channel, state.
- Conflict warnings (same channel same minute).
- Manual reschedule and cancel.

## Future Capability 4: Slack and Office 365 Integrations

### Goal
Enable secure external notifications and, later, operational workflow actions.

### Integration Model
Create an `integrations` module plus adapter extensions:
- `integrations` owns credentials metadata, connection status, and scope policy.
- `adapters` owns API calls.

### Security Requirements
- OAuth tokens encrypted at rest.
- Refresh token rotation.
- Scope minimization (least privilege).
- Secrets never exposed to client page state.
- Connection test endpoint with redacted logs.

### Slack Integration Details
Phase 1:
- App auth and channel selection.
- Post approval notifications and campaign summaries.

Phase 2:
- Interactive actions for approve/reject.
- Threaded updates on status changes.

### Office 365 Integration Details
Phase 1:
- Microsoft Graph auth.
- Send Outlook approval digests.
- Optional calendar event creation.

Phase 2:
- Teams notifications.
- Group-based reviewer routing.

### Integration Settings UI
Add "Integrations" settings area with:
- Connect/disconnect controls
- Scope status
- default channels/mail recipients
- test message button
- sync interval controls

## Future Capability 5: Genkit Flows

### Goal
Use Genkit flows to improve recommendation and writing quality while preserving human control.

### Planned Flows
- `offerStrategistFlow`
  - input: interview, constraints, market signals
  - output: ranked offer hypotheses with rationale
- `copyCoachFlow`
  - input: instruction pack + funnel step
  - output: channel variants + style compliance notes
- `replyCoachFlow`
  - input: comment + intent + policy
  - output: draft replies + escalation recommendation

### Guardrails
- Outputs are advisory only.
- No autonomous publish/send based on Genkit output.
- All generated artifacts pass through approval queue.

### Evaluation
Create offline eval set for:
- tone adherence
- compliance pass rate
- factuality/risk flags
- readability score
- conversion clarity score

## Future Capability 6: Social Opportunity Scout (Reddit, X, Facebook, Instagram)

### Goal
Help a beginner operator find high-value places to engage by surfacing scored conversation opportunities and suggested comments.

### Phase 0 first: manual research corpus
Before adding live scanning, the preferred starting point is a local manual-capture corpus in `data/research/`.

Why:
- the roadmap explicitly calls for manual-first research before infra heroics
- it keeps the workflow local-only and mock-safe
- it creates a reusable pattern library of pains, language, and opportunity hypotheses
- it lets the Opportunities Inbox evolve from durable repo data instead of hard-coded examples

Phase 0 capture should store:
- source and audience context
- observed pain point
- language worth reusing
- operator/workflow fit
- first-pass scoring
- suggested human next action or draft reply
- risk flags and approval requirement

### Operating Model (Slow and Controlled)
- Start with manual capture and review.
- Add batch scanning only after the manual corpus proves useful (no aggressive real-time scraping loops).
- When scanning exists, run it on a fixed cadence (for example every 15-30 minutes per source).
- Use per-platform request budgets and cooldowns.
- Produce recommendations for review, not automatic posting.

### Product Requirements
- User defines watchlists:
  - keywords, topics, hashtags, communities/subreddits, account lists
- System returns opportunity cards:
  - source post snippet
  - relevance score
  - engagement potential score
  - risk/compliance flags
  - suggested comment draft
  - reason why this is a good fit
- User can accept/edit/reject each suggested comment.
- Accepted comments move into approval workflow before sending.

### Data Model
Add types in `modules/core` and new `modules/social-scout`:
- `ScoutSourceConfig`
  - `platform`, `sourceId`, `query`, `enabled`, `scanIntervalMinutes`
- `ScoutRun`
  - `id`, `startedAt`, `completedAt`, `platform`, `status`, `itemsFound`
- `OpportunityItem`
  - `id`, `platform`, `sourceUrl`, `author`, `contentSnippet`, `score`, `scoreBreakdown`, `riskFlags[]`
- `SuggestedEngagement`
  - `opportunityId`, `draftComment`, `toneProfile`, `confidence`, `policyChecks[]`
- `OpportunityDecision`
  - `opportunityId`, `decision`, `reviewerId`, `timestamp`, `notes`

### UI Requirements
Add `Opportunities Inbox` page:
- Platform filters (Reddit/X/Facebook/Instagram)
- Score and risk filters
- Side-by-side view:
  - source context
  - suggested comment
  - quick rationale
- Actions:
  - `approve for reply`
  - `edit draft`
  - `skip`
  - `mute source`

### Adapter Requirements
- Use official APIs where available.
- Browser automation fallback only for explicitly allowed public pages.
- Add strict source allowlist and platform-specific compliance checks.
- Normalize all input into shared `OpportunityItem` schema.

### Guardrails
- No autonomous bulk commenting.
- No auto-send without human approval.
- No evasion behavior for platform anti-spam controls.
- Daily per-platform engagement caps enforced in settings.
- High-risk opportunities auto-route to manual review only.

### Why This Matches Your Use Case
It gives you a "slow scout" assistant: it reads sources, scores opportunities, and returns a suggested comment so you can decide where to engage.

## Architecture Changes Required

### New/Expanded Modules
- `modules/integrations/`
- `modules/copylab/` expanded for instruction-pack pipeline
- `modules/approvals/` expanded for assignment/audit
- `modules/publishing/` expanded for retries/windows
- `modules/adapters/` expanded for Slack and Office 365 connectors
- `modules/social-scout/` for opportunity discovery, ranking, and recommendation state

### Boundary Rules
- UI never calls Slack/Graph directly.
- Integrations config and auth state never leak outside integrations module contracts.
- Providers remain behind adapters.
- Social scout only proposes opportunities; approvals/publishing own any outbound action.

## Testing Strategy

### Unit
- style instruction compiler
- policy violation detection
- scheduler validation and idempotency
- notification payload formatting
- opportunity scoring and risk classification
- suggested engagement policy checks

### Integration
- discovery -> copy -> review -> schedule full flow
- review notification dispatch to mock Slack/Office
- schedule dispatch outcomes and retries
- social scout run -> opportunity cards -> review decision -> approval queue handoff

### End-to-End (mock)
- beginner walkthrough across all pages
- style profile application reflected in generated variants
- approval and calendar actions persist in session state
- opportunities inbox flow from source scan to approved engagement draft

### Security
- token storage redaction tests
- permission scope checks
- secret leakage tests for client payloads
- platform rate-limit and engagement-cap enforcement tests

## Documentation Changes Required (Yes, mandatory)

Every phase above requires doc updates in the same changeset.

### Root Docs
- `PRODUCT_DESIGN.md`
  - add style studio and integrations value narrative
- `MVP_SCOPE.md`
  - add style controls and integrations boundaries
- `SYSTEM_ARCHITECTURE.md`
  - add integrations module and auth boundary
- `DATA_FLOW.md`
  - add approval notification and external sync flows
- `PROJECT_RULES.md`
  - add secrets handling and provider-scope rules
- `DATA_FLOW.md`
  - add social scout flow: scan -> score -> suggest -> review -> approval
- `PROJECT_RULES.md`
  - add no-autonomous-commenting and platform-policy constraints
- `board.md`
  - add new lanes and task cards for integrations/style/genkit/social-scout
- `AGENTS.md`
  - add runbook for integration failures and issue logging

### Module Docs
- `modules/core/CONTRACT.md`
  - new style/integration/social-scout types
- `modules/copylab/CONTRACT.md` and `ANTI_PATTERNS.md`
  - instruction pack and style policy enforcement
- `modules/approvals/CONTRACT.md`
  - assignment/audit fields and transition rules
- `modules/publishing/CONTRACT.md`
  - retry and schedule window behavior
- `modules/adapters/CONTRACT.md`
  - Slack, Office, and social source endpoints and normalized responses
- `modules/strategy/CONTRACT.md`
  - Genkit-assisted recommendations
- `modules/integrations/CONTRACT.md` (new)
  - connection lifecycle and credential metadata
- `modules/social-scout/CONTRACT.md` (new)
  - source config, scoring, recommendation, and decision lifecycle

## Board Realignment Plan

### Add New Modules/Lanes
1. `learning-ui` lane: beginner coaching UX and tooltip clarity
2. `style-system` lane: instruction pack and style studio
3. `integrations` lane: Slack and Office settings + auth
4. `adapter-connectors` lane: Slack + Graph API connectors
5. `genkit` lane: flow scaffolds and eval harness
6. `social-scout` lane: opportunity discovery, ranking, and draft suggestion workflow

### Example Atomic Tasks
- Add `StyleProfile` type and validation -> `modules/core/src/types.ts`
- Add `buildInstructionPack()` -> `modules/copylab/src/instructions.ts`
- Add Integrations settings page shell -> `src/pages/integrations.ts`
- Add Slack connect status contract -> `modules/integrations/src/slack.ts`
- Add Graph connect status contract -> `modules/integrations/src/office365.ts`
- Add `offerStrategistFlow` scaffold -> `flows/offer-strategist.ts`
- Add `OpportunityItem` schema and score breakdown -> `modules/social-scout/src/types.ts`
- Add Reddit/X/Facebook/Instagram source adapters in mock mode -> `modules/adapters/src/social-sources.ts`
- Add opportunities inbox page shell -> `src/pages/opportunities.ts`

## Rollout Phases

### Phase 1: Stabilize and Document
- Reconcile board with current code reality.
- Update docs to include learning-mode and integrations plan.

### Phase 2: Style System
- Implement style types, UI controls, and copy validation pipeline.

### Phase 3: Approval and Scheduling Hardening
- Add assignment, audit, retries, and schedule windows.

### Phase 4: Integrations
- Implement Slack and Office auth/settings and notification send.

### Phase 5: Genkit
- Install flow scaffolds and eval harness.
- Keep advisory mode with mandatory human review.

### Phase 6: Social Opportunity Scout
- Implement slow batch source scanning with allowlists and budgets.
- Rank opportunities and generate suggested comments.
- Route all actions through approval workflow (no auto-posting).

## Definition of Done for This Initiative
- Beginner user can complete guided campaign lifecycle end-to-end.
- Style controls materially change generated copy and pass validation checks.
- Review queue can notify via Slack and Office in test mode.
- Campaign calendar supports schedule, dispatch, and retry visibility.
- Genkit flows run in advisory mode with evaluation reports.
- Social scout surfaces scored opportunities and suggested comments for human-approved engagement.
- All relevant docs and board tasks are updated in each changeset.
