#!/usr/bin/env node
/**
 * MCK-A3 — End-to-End Mock Flow Smoke Script (TEST-7 EXPANDED)
 *
 * Exercises the full mock flow through the mock-engine translation layer:
 * discovery → launch → review → calendar → P&P → comments → dashboard
 *
 * TEST-7 additions:
 *  - P&P: createProject, createTask, updateTaskStatus, getTasksByStatus,
 *    generateProjectPlan (project/task counts verified)
 *  - Calendar: scheduledAt timestamp + job_ prefix assertions on every entry
 *
 * Each step asserts at least one success condition. Exits non-zero on failure.
 *
 * Usage:
 *   npx tsx scripts/smoke-mock.ts
 */

import {
    submitDiscoveryInterview,
    getOfferSuggestions,
    approveOffer,
    createCampaign,
    sendToReview,
    approveAll,
    getReviewItems,
    scheduleAll,
    publishNow,
    getCalendar,
    pullComments,
    getCommentReplies,
    sendReplies,
    getDashboard,
    getEventLog,
    resetAll,
    // P&P additions
    getProjects,
    getTasks,
    createProject,
    createTask,
    updateTaskStatus,
    generateProjectPlan,
    getTasksByStatus,
} from '../src/mock-engine';

// ─── Helpers ──────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
    if (!condition) {
        console.error(`[FAIL] ${message}`);
        process.exit(1);
    }
}

function logStep(step: string): void {
    console.log(`[STEP] ${step}`);
}

function logOk(message: string): void {
    console.log(`  ✓ ${message}`);
}

// ─── Main Flow ────────────────────────────────────────────────────────────────

try {
    // Start fresh
    resetAll();
    logStep('Reset complete');

    // ─── Discovery Flow ───────────────────────────────────────────────────
    logStep('Discovery: Submit interview');
    const interview = submitDiscoveryInterview({
        businessName: 'Smoke Test Corp',
        industry: 'saas',
        targetCustomer: 'Small business owners',
        currentOfferings: ['Basic plan', 'Premium plan'],
        painPoints: ['High churn', 'Low conversion'],
        competitiveAdvantage: 'Best-in-class support',
    });
    assert(interview.id.startsWith('int_'), 'Interview ID has int_ prefix');
    assert(interview.version === 1, 'Interview version is 1');
    logOk(`Interview captured: ${interview.id}`);

    logStep('Discovery: Get offer suggestions');
    const hypotheses = getOfferSuggestions();
    assert(Array.isArray(hypotheses), 'Hypotheses is an array');
    assert(hypotheses.length > 0, 'At least one hypothesis returned');
    assert(hypotheses[0].id.startsWith('hyp_'), 'Hypothesis ID has hyp_ prefix');
    logOk(`Generated ${hypotheses.length} offer hypotheses`);

    logStep('Discovery: Approve offer');
    const profile = approveOffer(0);
    assert(profile.id.startsWith('prof_'), 'Profile ID has prof_ prefix');
    assert(profile.state === 'approved', 'Profile state is approved');
    logOk(`Offer approved: ${profile.id}`);

    // ─── Launch Flow ──────────────────────────────────────────────────────
    logStep('Launch: Create campaign');
    const campaign = createCampaign({
        offerName: profile.hypothesis.name,
        audience: 'small-business',
        channels: ['meta', 'linkedin'],
        goals: ['awareness', 'leads'],
    });
    assert(campaign.brief.id.startsWith('brief_'), 'Brief ID has brief_ prefix');
    assert(campaign.plan.id.startsWith('plan_'), 'Plan ID has plan_ prefix');
    assert(campaign.variants.variants.length > 0, 'Variants generated');
    assert(campaign.scores.length > 0, 'Scores computed');
    logOk(`Campaign created: ${campaign.brief.id}`);
    logOk(`Funnel plan: ${campaign.plan.id}`);
    logOk(`Variants: ${campaign.variants.variants.length}`);

    // ─── Review Flow ──────────────────────────────────────────────────────
    logStep('Review: Send to review queue');
    const batch = sendToReview();
    assert(batch.id.startsWith('batch_'), 'Batch ID has batch_ prefix');
    assert(batch.items.length > 0, 'Batch has review items');
    logOk(`Review batch: ${batch.id} with ${batch.items.length} items`);

    logStep('Review: Approve all items');
    approveAll();
    const reviewItems = getReviewItems();
    const approvedItems = reviewItems.filter(i => i.state === 'approved');
    assert(approvedItems.length === reviewItems.length, 'All items approved');
    logOk(`Approved ${approvedItems.length} items`);

    // ─── Calendar Flow ────────────────────────────────────────────────────
    logStep('Calendar: Schedule assets');
    const scheduled = scheduleAll();
    assert(Array.isArray(scheduled), 'Schedule returns array');
    assert(scheduled.length > 0, 'At least one entry scheduled');
    assert(scheduled[0].jobId.startsWith('job_'), 'Job ID has job_ prefix');
    logOk(`Scheduled ${scheduled.length} entries`);

    logStep('Calendar: Verify calendar');
    const calendar = getCalendar();
    assert(calendar.length > 0, 'Calendar has entries');
    // TEST-7 enhanced assertions
    assert(calendar.every(e => typeof e.runAt === 'string'), 'All entries have runAt timestamps');
    assert(calendar.every(e => e.jobId.startsWith('job_')), 'All calendar entries have job_ prefix');
    logOk(`Calendar contains ${calendar.length} entries`);
    logOk(`All entries have runAt timestamps and job_ IDs ✓`);

    logStep('Calendar: Publish now');
    const dispatched = publishNow();
    assert(Array.isArray(dispatched), 'Dispatch returns array');
    assert(dispatched.length > 0, 'At least one dispatch result');
    assert(dispatched.every(d => d.success), 'All dispatches succeeded');
    logOk(`Dispatched ${dispatched.length} jobs`);

    // ─── P&P Flow (TEST-7) ────────────────────────────────────────────────
    logStep('P&P: Create a project manually');
    const project = createProject('Smoke Campaign Setup', 'Pre-launch checklist');
    assert(project.id.startsWith('plan_'), 'Project ID has plan_ prefix');
    assert(project.name === 'Smoke Campaign Setup', 'Project name saved');
    logOk(`Project created: ${project.id}`);

    logStep('P&P: Create tasks and verify status transitions');
    const task1 = createTask(project.id, 'Write ad copy');
    const task2 = createTask(project.id, 'Set up tracking');
    const task3 = createTask(project.id, 'Design landing page');
    assert(task1.id.startsWith('task_'), 'Task ID has task_ prefix');
    assert(task1.status === 'todo', 'New task starts as todo');
    logOk(`Created 3 tasks under ${project.id}`);

    updateTaskStatus(task1.id, 'in_progress');
    updateTaskStatus(task2.id, 'in_progress');
    updateTaskStatus(task2.id, 'review');
    updateTaskStatus(task3.id, 'in_progress');
    updateTaskStatus(task3.id, 'review');
    updateTaskStatus(task3.id, 'completed');

    const inProgress = getTasksByStatus('in_progress');
    const inReview   = getTasksByStatus('review');
    const done       = getTasksByStatus('completed');
    assert(inProgress.some(t => t.id === task1.id), 'task1 transitions to in_progress');
    assert(inReview.some(t => t.id === task2.id), 'task2 transitions to review');
    assert(done.some(t => t.id === task3.id), 'task3 transitions to completed');
    logOk(`Status transitions: in_progress=${inProgress.length}, review=${inReview.length}, done=${done.length}`);

    logStep('P&P: Generate project plan from interview');
    const projectsBefore = getProjects().length;
    const tasksBefore    = getTasks().length;
    generateProjectPlan();
    const projectsAfter  = getProjects().length;
    const tasksAfter     = getTasks().length;
    assert(projectsAfter > projectsBefore, 'generateProjectPlan adds projects');
    assert(tasksAfter > tasksBefore, 'generateProjectPlan adds tasks');
    logOk(`Plan generated: +${projectsAfter - projectsBefore} projects, +${tasksAfter - tasksBefore} tasks`);

    // ─── Comments Flow ────────────────────────────────────────────────────
    logStep('Comments: Pull comments');
    const comments = pullComments();
    assert(Array.isArray(comments), 'Comments returns array');
    assert(comments.length > 0, 'At least one comment returned');
    assert(comments[0].commentId.startsWith('comment_'), 'Comment ID has comment_ prefix');
    logOk(`Pulled ${comments.length} comments`);

    logStep('Comments: Get reply drafts');
    const replies = getCommentReplies();
    assert(Array.isArray(replies), 'Replies returns array');
    assert(replies.length > 0, 'At least one reply draft');
    assert(replies[0].id.startsWith('reply_'), 'Reply ID has reply_ prefix');
    logOk(`Drafted ${replies.length} replies`);

    logStep('Comments: Verify reply drafts are gated through approvals');
    const replyReviewItems = getReviewItems().filter((item) => item.kind === 'reply');
    assert(replyReviewItems.length === replies.length, 'Each drafted reply is registered in the review queue');
    assert(replyReviewItems.every((item) => item.state === 'pending'), 'Drafted replies start in pending review state');
    logOk(`Registered ${replyReviewItems.length} reply review item(s)`);

    logStep('Comments: Send replies');
    sendReplies();
    const repliedEvents = getEventLog().filter((event) => event.name === 'CommentReplied');
    assert(repliedEvents.length === replies.length, 'Each drafted reply emitted a CommentReplied event after send');
    logOk(`Replies sent: ${repliedEvents.length}`);

    // ─── Dashboard Flow ───────────────────────────────────────────────────
    logStep('Dashboard: Get dashboard data');
    const dashboard = getDashboard();
    assert(dashboard.attribution !== undefined, 'Attribution present');
    assert(Array.isArray(dashboard.funnel), 'Funnel is array');
    assert(Array.isArray(dashboard.variants), 'Variants is array');
    logOk(`Attribution: $${dashboard.attribution.totalSpend} spend, $${dashboard.attribution.totalRevenue} revenue`);
    logOk(`Funnel stages: ${dashboard.funnel.length}`);
    logOk(`Variant performance rows: ${dashboard.variants.length}`);

    // ─── Event Log Summary ────────────────────────────────────────────────
    logStep('Event log: Summary');
    const events = getEventLog();
    assert(events.length > 0, 'Events recorded');
    const eventNames = [...new Set(events.map(e => e.name))];
    logOk(`Total events: ${events.length}`);
    logOk(`Event types: ${eventNames.join(', ')}`);

    // ─── Success ──────────────────────────────────────────────────────────
    console.log('\n[SUCCESS] Full mock flow completed successfully!\n');
    console.log('Flow steps validated:');
    console.log('  1. Discovery: interview → hypotheses → profile approval');
    console.log('  2. Launch: campaign → funnel plan → variants → scores');
    console.log('  3. Review: batch creation → approval');
    console.log('  4. Calendar: scheduling → dispatch (timestamps + job_ assertions)');
    console.log('  5. P&P: manual project + tasks + status transitions + generateProjectPlan');
    console.log('  6. Comments: pull → triage → reply drafts → send');
    console.log('  7. Dashboard: attribution, funnel, variant metrics');
    console.log();

    process.exit(0);
} catch (err) {
    console.error('\n[ERROR] Smoke test failed with exception:');
    console.error(err);
    process.exit(1);
}
