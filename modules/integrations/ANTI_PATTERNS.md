# integrations — Anti-Patterns

## ❌ Storing tokens in module state

OAuth tokens must never appear in `IntegrationConfig` or any exported type. They are managed at the environment/infrastructure level. If you find yourself adding a `token` field to a type in this module, stop.

## ❌ Making API calls from this module

HTTP calls to Slack or Graph belong in `adapters`. This module only validates scope and tracks status.

## ❌ Exposing token values to the UI

Integration settings page renders connection status and scope list only. No token, client secret, or credential string reaches the client page state.

## ❌ Skipping scope validation before send

`adapters` must call `validateIntegrationScope()` before dispatching any notification. Sending without scope validation can result in silent 403 errors or permission escalation.

## ❌ Building approval logic here

Whether to send a notification, and what its content is, are decided by `approvals` and `adapters`. This module does not own those decisions.
