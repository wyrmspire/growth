# approvals - Anti-Patterns

## AP-1: Implicit auto-approval in UI
Wrong: defaulting any new item to approved.
Why wrong: bypasses safety gate.
Right: new items start pending.

## AP-2: Editing artifact content in approval module
Wrong: modifying copy text in decision handler.
Why wrong: approval should validate, not author.
Right: send revision request back to source module.
