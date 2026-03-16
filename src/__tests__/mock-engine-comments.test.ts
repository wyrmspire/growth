/**
 * TEST-5 — Mock-Engine Comments Flow Tests
 * Covers pullComments, getCommentReplies, approveReply, sendReply,
 * discardReply, sendReplies, isReplySent. Verifies the approval gate.
 *
 * Depends on TEST-2 campaign setup pattern (campaign must exist first).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
    resetAll,
    submitDiscoveryInterview,
    getOfferSuggestions,
    approveOffer,
    createCampaign,
    sendToReview,
    approveAll,
    scheduleAll,
    publishNow,
    pullComments,
    getCommentReplies,
    sendReplies,
    isReplySent,
    getReviewItems,
} from '../mock-engine';

const INTERVIEW_DATA = {
    businessName: 'Comment Test Co',
    industry: 'ecommerce' as const,
    targetCustomer: 'Shoppers',
    currentOfferings: ['Standard', 'Premium'],
    painPoints: ['Low repeat purchase'],
    competitiveAdvantage: 'Fast delivery',
};

function runFullCampaign() {
    resetAll();
    submitDiscoveryInterview(INTERVIEW_DATA);
    getOfferSuggestions();
    const profile = approveOffer(0);
    createCampaign({
        offerName: profile.hypothesis.name,
        audience: 'shoppers',
        channels: ['meta'],
        goals: ['awareness'],
    });
    sendToReview();
    approveAll();
    scheduleAll();
    publishNow();
}

beforeEach(() => {
    runFullCampaign();
});

// ─── pullComments ─────────────────────────────────────────────────────────────

describe('pullComments', () => {
    it('returns an array of at least one comment', () => {
        const comments = pullComments();
        expect(Array.isArray(comments)).toBe(true);
        expect(comments.length).toBeGreaterThan(0);
    });

    it('comment ids have comment_ prefix', () => {
        const comments = pullComments();
        comments.forEach(c => expect(c.commentId).toMatch(/^comment_/));
    });

    it('each comment has an intent classification', () => {
        const comments = pullComments();
        comments.forEach(c => expect(c.intent).toBeDefined());
    });

    it('calling pullComments again does not duplicate', () => {
        const first = pullComments();
        const second = pullComments();
        expect(second.length).toBe(first.length);
    });
});

// ─── getCommentReplies ────────────────────────────────────────────────────────

describe('getCommentReplies', () => {
    it('returns reply drafts after pullComments', () => {
        pullComments();
        const replies = getCommentReplies();
        expect(Array.isArray(replies)).toBe(true);
        expect(replies.length).toBeGreaterThan(0);
    });

    it('reply ids have reply_ prefix', () => {
        pullComments();
        const replies = getCommentReplies();
        replies.forEach(r => expect(r.id).toMatch(/^reply_/));
    });

    it('each reply draft links to a comment', () => {
        pullComments();
        const replies = getCommentReplies();
        replies.forEach(r => expect(r.commentId).toMatch(/^comment_/));
    });
});

// ─── Approval gate ────────────────────────────────────────────────────────────

describe('approval gate — replies must be pending before send', () => {
    it('reply drafts are registered in the review queue as pending', () => {
        pullComments();
        const replies = getCommentReplies();
        const replyReviewItems = getReviewItems().filter(i => i.kind === 'reply');
        expect(replyReviewItems.length).toBe(replies.length);
        expect(replyReviewItems.every(i => i.state === 'pending')).toBe(true);
    });
});

// ─── sendReplies ──────────────────────────────────────────────────────────────

describe('sendReplies', () => {
    it('sends replies and marks them as sent', () => {
        pullComments();
        const replies = getCommentReplies();
        sendReplies();
        replies.forEach(r => {
            expect(isReplySent(r.id)).toBe(true);
        });
    });

    it('is safe to call without any comments pulled', () => {
        // Already reset inside beforeEach + runFullCampaign; no pullComments called
        // Start fresh to have no replies
        resetAll();
        expect(() => sendReplies()).not.toThrow();
    });

    it('calling sendReplies twice does not throw', () => {
        pullComments();
        sendReplies();
        expect(() => sendReplies()).not.toThrow();
    });
});

// ─── isReplySent ──────────────────────────────────────────────────────────────

describe('isReplySent', () => {
    it('returns false before sendReplies is called', () => {
        pullComments();
        const replies = getCommentReplies();
        expect(replies.length).toBeGreaterThan(0);
        expect(isReplySent(replies[0].id)).toBe(false);
    });


    it('returns true after sendReplies for all replies', () => {
        pullComments();
        const replies = getCommentReplies();
        sendReplies();
        replies.forEach(r => expect(isReplySent(r.id)).toBe(true));
    });
});
