/**
 * email-adapter.ts — ADAPT-6
 * Platform adapter for transactional / marketing email via SMTP or ESP.
 *
 * Mock-safe mode (default): when SMTP_HOST is absent, all methods return
 * deterministic mock responses. No real SMTP connections, no errors thrown.
 *
 * Live mode (future): wire a Nodemailer transport using cred.value (SMTP host)
 * and cred.secret (SMTP password). See TODO blocks below.
 *
 * Anti-pattern guard:
 * - AP-1: No domain decisions here — just execute the request.
 * - AP-2: Map all responses to core types before returning.
 *
 * Note: Email "comments" are approximated as reply-to thread entries.
 *   In live mode this would integrate with an inbound mailbox or ESP webhook.
 */

import type {
    AdapterPublishRequest,
    AdapterPublishResponse,
    AdapterCommentEvent,
    ReplyPayload,
    EntityId,
    CommentRecord,
} from '@core/types';
import { newEntityId } from '@core/id';
import type { ProviderAdapter } from './registry';
import { getCredentialStore, isCredentialValid } from './credentials';

// ── Mock data ─────────────────────────────────────────────────────

function mockEmailReplies(campaignId: EntityId): AdapterCommentEvent[] {
    const records: CommentRecord[] = [
        {
            id: newEntityId('comment'),
            channel: 'email',
            campaignId,
            authorName: 'subscriber@example.com',
            body: 'Thanks for reaching out — could you send me more details about pricing?',
            timestamp: new Date().toISOString(),
        },
        {
            id: newEntityId('comment'),
            channel: 'email',
            campaignId,
            authorName: 'noreply@bounce.invalid',
            body: 'Delivery failure: address not found.',
            timestamp: new Date().toISOString(),
        },
    ];
    return records.map(comment => ({
        comment,
        raw: { source: 'email-mock', messageId: `mock_email_${campaignId}@example.com` },
    }));
}

// ── Adapter factory ───────────────────────────────────────────────

export function makeEmailAdapter(): ProviderAdapter {
    return {
        name: 'email',

        publish(req: AdapterPublishRequest): AdapterPublishResponse {
            const cred = getCredentialStore().get('email');

            if (!isCredentialValid(cred)) {
                console.info(`[email-adapter] mock-safe publish (job ${req.jobId}) — no live credential.`);
                return {
                    jobId: req.jobId,
                    channel: 'email',
                    success: true,
                    externalId: `email_mock_${req.jobId}_${Date.now().toString(36)}`,
                };
            }

            // ── Live mode skeleton ────────────────────────────────
            // cred.value = SMTP host (e.g. smtp.mailgun.org:587)
            // cred.secret = SMTP password / API key
            //
            // TODO: create Nodemailer transporter:
            //   const transporter = nodemailer.createTransport({
            //     host: cred.value,
            //     port: 587,
            //     secure: false,
            //     auth: { user: process.env.SMTP_USER, pass: cred.secret },
            //   });
            // TODO: parse req.content into { subject, html } (expect JSON or delimiter)
            // TODO: await transporter.sendMail({ from, to: campaignRecipients, subject, html })
            // TODO: map info.messageId → externalId
            // TODO: handle ECONNREFUSED, AUTH_FAILED, RECIPIENT_BOUNCE errors
            console.info(`[email-adapter] live publish (job ${req.jobId}) — credential present.`);
            return {
                jobId: req.jobId,
                channel: 'email',
                success: true,
                externalId: `email_live_${req.jobId}_stub`,
            };
        },

        ingestComments(campaignId: EntityId): AdapterCommentEvent[] {
            const cred = getCredentialStore().get('email');

            if (!isCredentialValid(cred)) {
                return mockEmailReplies(campaignId);
            }

            // TODO: poll inbound mailbox via IMAP or ESP webhook queue
            //   Filter by X-Campaign-ID header matching campaignId
            // TODO: map each email reply to CommentRecord (author = From header)
            console.info(`[email-adapter] live ingestComments (campaign ${campaignId}) — credential present.`);
            return mockEmailReplies(campaignId); // stub until live wired
        },

        sendReply(payload: ReplyPayload): AdapterPublishResponse {
            const cred = getCredentialStore().get('email');

            if (!isCredentialValid(cred)) {
                return {
                    jobId: payload.replyId,
                    channel: 'email',
                    success: true,
                    externalId: `email_reply_mock_${Date.now().toString(36)}`,
                };
            }

            // TODO: create Nodemailer transporter (same as publish)
            // TODO: await transporter.sendMail with:
            //   In-Reply-To: {payload.commentId} (use as Message-ID reference)
            //   body: payload.body
            // TODO: map info.messageId → externalId
            console.info(`[email-adapter] live sendReply (reply ${payload.replyId}) — credential present.`);
            return {
                jobId: payload.replyId,
                channel: 'email',
                success: true,
                externalId: `email_reply_live_${payload.replyId}_stub`,
            };
        },
    };
}
