# integrations — Contract

Owner: integrations
Depends on: core
Depended on by: adapters (for outbound notification dispatch)

## Purpose

This module owns credential metadata, connection lifecycle state, and integration scope policy for all external collaboration tool connections (Slack, Office 365).

It does NOT own API calls — those remain in `adapters`.
It does NOT store OAuth tokens directly — it stores references and connection status only.

## Exported Types

- `IntegrationProvider` — `'slack' | 'office365'`
- `ConnectionStatus` — `'disconnected' | 'connected' | 'error' | 'scope_limited'`
- `IntegrationConfig`
  - `provider: IntegrationProvider`
  - `status: ConnectionStatus`
  - `scopesGranted: string[]`
  - `defaultChannelOrRecipient: string`
  - `testSentAt?: string` (ISO 8601 UTC)
  - `connectedAt?: string` (ISO 8601 UTC)
  - `lastErrorMessage?: string`
- `IntegrationSettings`
  - `slack?: IntegrationConfig`
  - `office365?: IntegrationConfig`

## Exported Functions

### getIntegrationSettings(): IntegrationSettings
Purpose: Return the current integration connection state for all providers.
Errors: none (returns disconnected state if not configured)
Invariants:
- Always returns a value; never throws on missing config.
- Token values are never included in the return payload.

### validateIntegrationScope(config: IntegrationConfig, requiredScopes: string[]): boolean
Purpose: Confirm all required scopes are present in the granted set before attempting a notification send.
Errors: none (returns false if any scope is missing)
Invariants:
- Deterministic for same inputs.
- Does not make network calls.

## Secrets Boundary

- OAuth tokens and refresh tokens are NEVER stored in this module's types.
- Credential encryption and storage is handled at the infrastructure/environment level.
- This module only tracks whether a connection exists and what scopes it has.
- The UI must never receive or render token values.

## Module Invariants

1. Integrations owns connection metadata and scope policy only.
2. API calls to Slack or Graph are owned by adapters, not this module.
3. Secrets never cross the module boundary into UI state.
4. BACK-1 and BACK-2 depend on this contract being stable before adapter connectors are added.
