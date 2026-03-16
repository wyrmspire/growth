# core - Contract

Owner: core
Depends on: none
Depended on by: all modules

## Exported Types

- EntityId
- IdPrefix (`camp | offer | brief | copy | var | batch | item | job | reply | comment | plan | task | hyp | sig | prof | int | style | srun | opp | eng | dec | prev`)
- CampaignBrief
- CopyVariant
- ApprovalState
- PublishJob
- CommentRecord
- CommentIntent
- CampaignMetricRow
- AppError
- Project — `{ id, name, status, description? }` (FW-1, P3)
- Task — `{ id, title, status: TaskStatus, projectId, description?, dueDate?, assignee? }` (FW-1, P3)
- TaskStatus — `'todo' | 'in_progress' | 'review' | 'completed' | 'done'` (FW-1, P3)
- DomainEventName — now includes `ProjectCreated`, `TaskCreated`, `TaskStatusUpdated` (FW-2, P3), `CredentialSet`, `PlatformAvailabilityChecked` (ADAPT-1, Sprint 4)

### Platform Credential types (ADAPT-1, Sprint 4 — adapters-layer only)

- `PlatformName` — `'meta' | 'linkedin' | 'x' | 'email'`
- `PlatformCredential` — holds one platform credential value; **ONLY readable in `modules/adapters/src/`**
- `CredentialStore` — interface for the in-memory credential Map; **ONLY used in `credentials.ts`**
- `PlatformAvailability` — **SAFE cross-layer type**: boolean status per platform, NO token values; allowed in health endpoint and UI read-models

### Staged future types (not yet wired into handlers)

- `ReviewAssignment` — `{ itemId, assigneeId, assignedAt, slaMinutes }` (FW-5, P5)
- `ReviewComment` — `{ id, itemId, reviewerId, createdAt, body, revisionNotes? }` (FW-5, P5)
- `ReviewDecisionAudit` — `{ itemId, reviewerId, decision, decidedAt, notes?, auditEntries[] }` (FW-5, P5)
- `StyleProfile` — `{ id, name, tone, formality, clarity, ctaIntensity, readingLevel, bannedTerms[], requiredPhrases[], allowedClaims[] }` (FUT-1)
- `ChannelStyleOverride` — `{ channel, maxLength, emojiPolicy, hashtagPolicy, lineBreakPolicy }` (FUT-1)
- `CampaignInstructionPack` — `{ campaignId, styleProfileId, channelOverrides[], complianceRules[] }` (FUT-1)
- `GeneratedCopyAudit` — `{ variantId, styleProfileId, policyVersion, violations[], score }` (FUT-1)
- `ApprovedCopySnippet` — `{ id, variantId, campaignId, channel, text, approvedAt, styleProfileId }` (copy-memory, FUT-4)
- `ScoutSourceConfig`, `ScoutRun`, `OpportunityItem`, `SuggestedEngagement`, `OpportunityDecision` — see `modules/social-scout/CONTRACT.md` (FUT-3)

## Exported Functions

### validateCampaignBrief(input: CampaignBriefInput): ValidationResult
Purpose: Validate canonical campaign brief shape.
Errors: BRIEF_INVALID_FIELDS, BRIEF_MISSING_CHANNEL
Invariants:
- Returns normalized brief on success.
- Never mutates caller input.

### newEntityId(prefix: string): EntityId
Purpose: Create stable typed IDs for domain entities.
Errors: ID_PREFIX_INVALID
Invariants:
- Prefix must be known type.
- Returned ID is globally unique within project scope.

### assertApprovalState(state: ApprovalState, required: ApprovalState): Result
Purpose: Gate actions behind required review state.
Errors: APPROVAL_STATE_MISMATCH
Invariants:
- Used by publishing and comments before send actions.

## Module Invariants

1. Core owns shared cross-module types.
2. Core has no dependency on domain modules.
3. All domain boundary payloads map to core types.
