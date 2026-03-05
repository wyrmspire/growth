# MVP_SCOPE.md - GrowthOps OS

## Must Have (IN)

| Capability | Description | Layer Owner |
|---|---|---|
| Learning Mode UI | Beginner-friendly pages with contextual tooltips and plain-language guidance | ui + mock-engine |
| Offer Discovery Workspace | Guided business interview and offer hypothesis generation | strategy + core |
| Campaign Briefs | Store offer, audience, channel intent, CTA goals | core + funnel |
| Copy Generation | Generate channel-specific ad and nurture variants | copylab |
| Funnel Planner | Build stage sequence with message mapping | funnel |
| Approval Queue | Human review gate before publish/reply | approvals |
| Publishing Scheduler | Queue and dispatch approved assets via adapters | publishing + adapters |
| Comment Ops | Classify comments and draft reply candidates | comments |
| Attribution Dashboard | Basic CPL/conversion views by channel and campaign | analytics |
| Style Studio (shell) | Style profile and instruction-pack foundation — mock-safe shell staged in FUT-1 | copylab + core |
| Integrations (shell) | Slack and Office 365 connection lifecycle and scope policy — mock-safe shell staged in FUT-2 | integrations + adapters |
| Opportunities Inbox (shell) | Social-scout opportunity cards and suggested engagement — mock-safe shell staged in FUT-3 | social-scout + approvals |

## Must Not Have (OUT)

| Exclusion | Why Not in MVP |
|---|---|
| Positioning this app as a product to sell | MVP is internal training + execution for your own/client campaigns |
| Autonomous offer decisions with no human review | Strategic decisions require operator ownership |
| Fully autonomous posting with no approval | Safety and quality risk |
| Bot spam/comment flooding | Violates platform rules and brand trust |
| Automated budget bidding engine | Too large and high-risk for MVP |
| CRM replacement features | Not required for initial value |
| Image/video generation stack | Adds complexity without blocking core workflows |

## Exit Criteria

1. A user can complete Launch flow end-to-end with mock adapters.
2. A user can complete Offer Discovery flow and save a reviewed offer profile.
3. A beginner can complete a guided learning walkthrough across all core pages.
4. Every publish action requires approved artifact state.
5. Comments flow supports classify -> draft -> review -> send.
6. Dashboard shows campaign-level results and funnel step conversion.
7. All module contract functions tagged MVP are implemented and tested.
8. Board reaches zero only after all above criteria pass.

## Intentionally Thin Layers

- Adapters initially mock provider APIs but preserve final contract shape.
- Analytics can use event projections first before warehouse sync.
- Comment classifier can start rule-based with AI-assisted fallback.
- Offer recommendation can begin rule-first with a TODO for a Genkit strategy agent.
- Learning Mode can run fully in mock mode with no web integrations.
