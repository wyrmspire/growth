# Interview Notes - GrowthOps OS

Date: 2026-03-04
Interviewer: Codex
Stakeholder: Founding team

## Block 1: Identity and Purpose

1. What does this thing do in one sentence?
A marketing operations system that plans offers, generates channel-ready copy, coordinates approvals, schedules publishing, and tracks results.

2. Who is it for?
- Founder/operator running client acquisition
- Marketing coordinator executing campaigns
- Copywriter/editor approving brand voice and compliance

3. What problem does it solve?
Current workflow is fragmented across docs, chats, and tools, causing copy drift, missed posting windows, and inconsistent follow-up.

4. What should users feel?
In control, fast, and confident that campaigns are consistent and compliant.

## Block 2: Signature Moment

5. Most impressive 10-second sequence
User picks an offer and audience, clicks "Generate Launch Pack", instantly gets ad variants by channel, funnel steps, comment-reply scripts, and a 7-day posting calendar.

6. One screen to sell product
Campaign Launch Console: left side offer + audience controls, right side generated assets + approval state + publish schedule.

## Block 3: Scope Boundaries

7. Must exist in V1
- Offer and audience brief library
- Ad and message copy generation by channel
- Funnel step planner
- Human approval queue
- Scheduled publishing pipeline (mock adapters first)
- Comment triage and reply draft assistant
- Basic attribution dashboard

8. Must NOT exist in V1
- Fully autonomous posting without approval
- Black-hat automation or spam behavior
- Direct ad spend optimization engine
- CRM replacement

9. Temptations to defer
- Full multi-tenant billing
- Complex AI personalization by user cohort
- Automated creative image generation pipeline

10. What does V3 look like?
Cross-channel orchestration with adaptive testing, budget recommendations, richer CRM syncing, and policy-aware workflow automation.

## Block 4: Technical Constraints

11. Where does data come from?
User-entered briefs, campaign metadata, platform analytics, incoming comments.

12. Where does data go?
Campaign assets, approval records, posting jobs, analytics snapshots, and exportable reports.

13. Integrations
Meta, LinkedIn, X, email provider, optional webhook/CRM connectors.

14. Hard performance requirements
- Copy generation response under 5s target for single asset set
- Dashboard updates under 2s for local projections

15. Platforms
Web app first (desktop primary, mobile secondary).

## Block 5: Risk and Reality

16. Biggest risk
Doc/code drift and unsafe automation behavior.

17. What failed before?
Ad hoc scripts and disconnected tools without clear ownership.

18. Deadline and consequence
MVP ready for active campaign operations within 6 weeks; delay slows lead pipeline execution.

## Interview Summary

Product in one sentence: GrowthOps OS unifies campaign planning, copy generation, approvals, publishing, and analytics in one execution system.
Primary user: Founder/operator with a small marketing team.
Core value prop: Faster launches with consistent message quality and controlled automation.
Signature moment: One-click generation of a complete campaign launch pack.
V1 feature count: 7 core capabilities.
Biggest risk: Drift and unsafe automation.
Recommended doc depth: full
