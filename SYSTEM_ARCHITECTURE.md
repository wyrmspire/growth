# SYSTEM_ARCHITECTURE.md - GrowthOps OS

## Layer Diagram

ui -> workflows -> domain modules -> adapters
ui -> read-models
read-models <- event-log

Allowed dependencies are unidirectional only.

## Layer Responsibilities

### ui
Responsibility: Render operator views, learning guidance, and collect intents.
Must never: Call external platforms directly; bypass approvals.
Depends on: workflows, read-models, core types.

### mock-engine (workflow adapter)
Responsibility: Translate product UI actions into module mock functions in local mode.
Must never: Become the source of truth for domain contracts.
Depends on: domain modules.

### workflows
Responsibility: Orchestrate cross-module business flows.
Must never: Own long-term state schema; embed provider-specific code.
Depends on: domain modules, core.

### domain modules
Responsibility: Implement bounded capabilities.
Must never: Cross-import sibling module internals.
Depends on: core, event-log.

### adapters
Responsibility: Wrap external platform APIs.
Must never: Contain domain business decisions.
Depends on: core, provider SDKs.

### strategy and research
Responsibility: Convert business interviews and market signals into offer hypotheses.
Must never: Auto-commit strategic decisions without operator approval.
Depends on: core, analytics, adapters.

### read-models and analytics
Responsibility: Derive reporting views from events.
Must never: Mutate domain state directly.
Depends on: event-log, core.

## Domain Modules

- core: shared types, IDs, validation, errors.
- strategy: business discovery interview, offer hypotheses, and recommendation summaries.
- copylab: copy generation, variant policies, channel formatting.
- funnel: campaign briefs, stage sequencing, CTA mapping.
- approvals: review workflow and gate enforcement.
- publishing: schedule and dispatch pipeline.
- comments: comment ingest, classification, draft replies.
- analytics: attribution and conversion projections.
- learning-ui: tooltip system, beginner walkthrough, and page-level guidance.
- mock-engine: local translation layer for offline learning/testing mode.

## Request Lifecycle (ASCII)

User action (UI)
  -> Workflow command
  -> Domain module validation
  -> Event emitted
  -> Optional adapter action (if approved)
  -> Read model update
  -> UI refresh

## Anti-Spaghetti Rules

1. No circular dependencies.
2. No catch-all utils/shared module for domain logic.
3. No module mutates another module's state.
4. Cross-module data passes through core contracts only.
5. Providers are isolated behind adapters.

## Complexity Risks

- Adapter behavior differences by channel can leak into domain logic.
- Approval bypass paths may appear under time pressure.
- Copy generation quality drift if prompts and policies are not versioned.
- Dashboard trust drops if event semantics are inconsistent.
- Market scraping can violate site policy unless constrained to permitted sources.

## Technology Decisions

- Event-first state transitions for replayability and audit.
- Contract-first module docs before code implementation.
- Mock adapter baseline to unblock UI and workflow implementation.
- APIs are primary market-signal source; Playwright automation is fallback for allowed public pages only.
