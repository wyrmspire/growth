# PRODUCT_DESIGN.md - GrowthOps OS

## Product Identity
GrowthOps OS is an internal marketing coaching and execution system for an automation company. It teaches a beginner operator how marketing works while guiding them to run real campaigns for their own business or client businesses (for example, a design company). It helps discover viable offers and positioning, then converts a selected offer and audience brief into coordinated campaign assets, human-reviewed approvals, scheduled publishing actions, and measurable outcomes.

## Positioning Lock
This project is not a product being sold to marketers. It is an internal training and execution cockpit.

## Target Users
- Beginner operator with little or no marketing background, learning by doing.
- Founder/operator: defines offer, positioning, and campaign goals.
- Marketing coordinator: executes campaign tasks and schedules posts.
- Copy lead/editor: reviews messaging, compliance, and tone.

## Emotional Outcome
Users should feel:
- Focused: one place to run campaign execution.
- Safe: approvals and policy checks reduce risk.
- Fast: less copy rewriting and less operational friction.
- Clear: each screen explains concepts in plain language with guided tooltips.

## Signature Moment
1. User selects offer template and audience profile.
2. User clicks Generate Launch Pack.
3. System returns channel-specific ad copy, funnel sequence, posting calendar, and comment-response playbook.
4. User sees contextual explanations for each concept and action while approving and scheduling.

## Core User Flows

### Flow -1: Learn the system as a beginner
1. User enters the app in Learning Mode.
2. User sees plain-language definitions and contextual tooltips.
3. User follows a guided sequence: discovery -> launch -> review -> calendar -> comments -> dashboard.
4. User can always view "what this means" help before taking action.

### Flow 0: Discover business details and offerings
1. User answers a guided business discovery interview.
2. System proposes offer hypotheses, ICP options, and angle suggestions.
3. User accepts, edits, or rejects recommendations.
4. Approved offer profile becomes input for campaign briefs.

### Flow 1: Launch a campaign
1. Create or select campaign brief.
2. Generate copy variants by channel.
3. Build funnel steps and CTAs.
4. Send assets to approval queue.
5. Schedule approved assets for publishing.
6. Monitor results and comments.

### Flow 2: Manage incoming comments
1. Ingest comments from channels.
2. Classify comment intent (lead, objection, spam, support).
3. Draft reply with brand-safe language.
4. Human approve or edit.
5. Publish reply and record event.

### Flow 3: Improve copy quality over time
1. Compare variant performance by channel and funnel stage.
2. Mark winning and weak messages.
3. Feed learning into next brief and copy generation.

## Operator Control Model

- AI suggestions are always labeled with both a source (`mock-engine`, `genkit-mock`, or `genkit-live`) and an advisory phase (`suggested`, `in-review`, `approved`, `rejected`).
- Discovery, launch, and comment coaching remain useful even when the local flow server is offline because the UI falls back to deterministic mock guidance.
- The approval gate is visible in the product language and UI. Nothing is sent, scheduled, or published unless a human operator approves it first.
- The intended user experience is "the system suggests, you decide," even when the guidance is AI-assisted.

## Post-MVP Roadmap

### V1.1
- Real adapter rollout for 1-2 channels.
- Approval SLA tracking.
- Offer hypothesis scoring based on early campaign outcomes.

### V1.2
- A/B test orchestration and automated winner suggestions.
- Cohort-level conversion breakdown.

### V2.0
- CRM integration and lead lifecycle handoff.
- Multi-workspace role model.

### V3.0
- Adaptive multi-channel optimization with guardrails.
- End-to-end campaign simulation before publish.

## UI Language Rules (GUIDE-4)

These rules apply to all UI copy, page descriptions, coaching blocks, and button labels.

### Use this language
- "Build a campaign for your business or a client"
- "Run campaigns for your business or a client's business"
- "Your offer" / "the offer" (not "the product")
- "Approve before it goes live" (reinforce human control)
- "The system suggests — you decide" (AI is advisory)
- "Try a starter example" (for presets — makes it exploratory, not tutorial-mandatory)

### Do NOT use this language
- "Our platform" / "Our software" / "Our tool" (implies a product being sold)
- "Marketers will love..." (this is not a product being sold to marketers)
- "Sign up" / "Get started" / "Free trial" (no SaaS framing)
- "Powered by AI" as a headline claim (AI is advisory, not the feature)
- Passive forms implying the system acts autonomously: "AI will send..." → "You approve, then it sends"

### Coaching block format
Every page must have a coaching block with three parts:
1. **What you do here** — plain action description, no jargon
2. **Why it matters** — business reason, connects action to outcome
3. **What comes next** — links to the next step in the campaign journey
