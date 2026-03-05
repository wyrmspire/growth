# DATA_FLOW.md - GrowthOps OS

## Flow A: Campaign Launch

UI: Launch Console
  -> workflows.launchCampaign(briefId)
  -> funnel.getBrief(briefId)
  -> copylab.generateVariants(brief, channels)
  -> approvals.createBatch(assetIds)
  -> event-log.append(CampaignDrafted)
  -> read-models.refresh(CampaignStatus)

Data crossing boundaries:
- BriefInput (core)
- CopyVariant[] (core)
- ApprovalBatch (core)

## Flow B: Approval to Publishing

UI: Approval Queue
  -> approvals.approveAsset(assetId, reviewerId)
  -> event-log.append(AssetApproved)
  -> publishing.schedule(assetId, runAt, channel)
  -> adapters.enqueuePublish(job)
  -> event-log.append(PublishScheduled)
  -> read-models.refresh(PublishCalendar)

Data crossing boundaries:
- ApprovalDecision
- PublishJob
- PublishReceipt

## Flow C: Comment Operations

adapters.ingestComments(channel, campaignId)
  -> comments.classify(comment)
  -> comments.draftReply(comment, policy)
  -> approvals.createReplyReview(replyDraft)
  -> UI reviewer approves
  -> adapters.sendReply(reply)
  -> event-log.append(CommentReplied)
  -> read-models.refresh(CommentOpsDashboard)

Data crossing boundaries:
- CommentRecord
- CommentIntent
- ReplyDraft
- ReplyDecision

## Flow D: Attribution Projection

event-log.stream(campaignId)
  -> analytics.projectAttribution(events)
  -> read-models.CampaignMetrics
  -> UI dashboard

Data crossing boundaries:
- AttributionEvent
- CampaignMetricRow

## Flow E: Offer Discovery and Market Signals

UI: Strategy Workspace
  -> strategy.captureInterview(responseSet)
  -> strategy.generateOfferHypotheses(interview, constraints)
  -> adapters.collectMarketSignals(sourcePlan)
  -> strategy.rankHypotheses(hypotheses, marketSignals)
  -> approvals.reviewOfferProfile(profile)
  -> event-log.append(OfferProfileApproved)
  -> read-models.refresh(OfferReadiness)

Data crossing boundaries:
- DiscoveryInterview
- OfferHypothesis[]
- MarketSignal[]
- OfferProfile
