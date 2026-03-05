# social-scout — Anti-Patterns

## ❌ Auto-sending approved comments without an OpportunityDecision

Every outbound action requires an explicit `OpportunityDecision` with `decision: 'approved_for_reply'` that has been routed through the approvals workflow. There is no shortcut.

## ❌ Scan intervals below 15 minutes

Aggressive polling violates platform rate limits and anti-spam rules. `validateSourceConfig()` hard-rejects intervals below 15 minutes. Do not work around this check.

## ❌ Adding platforms to the scan without updating the allowlist

New platforms require explicit allowlist additions in `validateSourceConfig()`, documentation in CONTRACT.md, and rate-limit policy in SYSTEM_ARCHITECTURE.md. Do not add scan targets ad hoc.

## ❌ Bulk-approving high-risk opportunities

Items with `riskFlags.length > 0` route to manual review only. They cannot be included in batch-approval actions regardless of score.

## ❌ Embedding platform credentials in this module

API keys, OAuth tokens, and session cookies belong in `adapters` and environment config. This module never stores or passes authentication material.

## ❌ Treating suggested comments as final

`SuggestedEngagement.draftComment` is a starting point for human editing, not a ready-to-post output. The UI must make this distinction visible.
