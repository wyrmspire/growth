# adapters - Contract

Owner: adapters
Depends on: core
Depended on by: publishing, comments

## Exported Types

- AdapterName
- AdapterPublishRequest
- AdapterPublishResponse
- AdapterCommentEvent

## Exported Functions

### enqueuePublish(req: AdapterPublishRequest): AdapterPublishResponse
Purpose: Queue publish action to provider-specific implementation.
Errors: ADAPTER_NOT_CONFIGURED, PROVIDER_REQUEST_FAILED

### ingestComments(channel: AdapterName, campaignId: EntityId): AdapterCommentEvent[]
Purpose: Pull or receive comment stream data.
Errors: COMMENT_INGEST_FAILED

### sendReply(channel: AdapterName, payload: ReplyPayload): AdapterPublishResponse
Purpose: Send approved reply.
Errors: REPLY_SEND_FAILED

## Module Invariants

1. Adapters own provider SDK usage.
2. Adapters never apply domain policy decisions.
3. Provider failures are translated to core error format.
