# adapters - Contract

Owner: adapters
Depends on: core
Depended on by: publishing, comments, server.ts

## Exported Types

- AdapterName
- AdapterPublishRequest
- AdapterPublishResponse
- AdapterCommentEvent
- ProviderAdapter (registry internal; used by adapter implementations)

## Exported Functions

### enqueuePublish(req: AdapterPublishRequest): EnqueuePublishOutcome
Purpose: Queue publish action to provider-specific implementation.
Errors: ADAPTER_NOT_CONFIGURED, PROVIDER_REQUEST_FAILED

### ingestComments(channel: AdapterName, campaignId: EntityId): IngestCommentsOutcome
Purpose: Pull or receive comment stream data.
Errors: COMMENT_INGEST_FAILED

### sendReply(channel: AdapterName, payload: ReplyPayload): SendReplyOutcome
Purpose: Send approved reply.
Errors: REPLY_SEND_FAILED

### getPlatformAvailability(platform: PlatformName): PlatformAvailability  _(ADAPT-7)_
Purpose: Return boolean credential availability for a single platform. Safe to pass to health endpoint or UI — carries NO token values.

### getAllPlatformAvailability(): PlatformAvailability[]  _(ADAPT-7)_
Purpose: Return boolean availability for all 4 registered platforms.

### seedCredentialsFromEnv(): void  _(ADAPT-7)_
Purpose: Populate credential store from environment variables at server startup.
Call site: server.ts startup only.

## Platform Adapters  _(ADAPT-3 through ADAPT-6)_

| File | Platform | Credential env var(s) |
|------|----------|-----------------------|
| `meta-adapter.ts` | Meta (Facebook/Instagram) | `META_ACCESS_TOKEN` |
| `linkedin-adapter.ts` | LinkedIn | `LINKEDIN_ACCESS_TOKEN` |
| `x-adapter.ts` | X (Twitter) | `X_API_KEY`, `X_API_SECRET` |
| `email-adapter.ts` | Email / SMTP | `SMTP_HOST`, `SMTP_PASS` |

All adapters degrade gracefully to mock-safe mode when credentials are absent. Currently 8+ platforms are tracked in `src/setup-store.ts` (client-side) and supported for unified credential management in `server.ts`.

## Server Endpoints (via `server.ts`)

- `POST /api/test-connection/:platform` - Lightweight credential validation.
- `POST /api/credentials/:platform` - Set credential (kind: 'api_key' | 'oauth_token' | 'smtp', value, secret).
- `GET /api/credentials/status` - Returns availability array without exposing raw tokens.
- `DELETE /api/credentials/:platform` - Discards stored credential.

## Module Invariants

1. Adapters own provider SDK usage.
2. Adapters never apply domain policy decisions.
3. Provider failures are translated to core error format.
4. **Credential values NEVER leave this module.** Only `PlatformAvailability` (boolean status) may cross into UI, domain modules, or mock-engine.
5. `credentials.ts` may only be imported by files inside `modules/adapters/src/`.
