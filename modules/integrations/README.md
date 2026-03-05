# integrations

## What this module does

Manages the connection lifecycle and scope policy for external collaboration tool integrations: Slack and Office 365.

It tracks whether a connection exists, what scopes are granted, and what the default notification target is. It does not own API calls or secrets storage.

## What it does NOT do

- It does not call Slack or Graph APIs directly. Those calls belong to `adapters`.
- It does not store OAuth tokens. Tokens are handled at the infrastructure level.
- It does not decide what content to send. That decision belongs to `approvals` or `adapters`.

## Phase 1 scope (tracked in board.md FUT-2)

- Connection status types and validation.
- Scope requirement checking.
- Integration settings shell in the UI.

## Phase 2 scope (tracked in future.md)

- Interactive Slack approve/reject actions.
- Teams notification webhook.
- Group-based reviewer routing for Office 365.

## Boundary rules

- UI reads connection status only — never token values.
- Adapter calls are gated by `validateIntegrationScope()` before sending.
- All integration changes are logged as domain events.
