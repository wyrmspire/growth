/**
 * CORE-B2 — EventLog + DomainEventName Test Suite
 */

import { EventLog } from '../events';
import type { DomainEventName, EntityId } from '../types';

// All event names defined in the domain — used for coverage verification
const ALL_EVENT_NAMES: DomainEventName[] = [
    'InterviewCaptured',
    'OfferHypothesesGenerated',
    'OfferProfileApproved',
    'CampaignDrafted',
    'FunnelPlanCreated',
    'VariantsGenerated',
    'VariantsScored',
    'ReviewBatchCreated',
    'AssetApproved',
    'AssetRejected',
    'PublishScheduled',
    'PublishDispatched',
    'CommentsIngested',
    'CommentClassified',
    'ReplyDrafted',
    'CommentReplied',
    'AttributionProjected',
    'StyleProfileCreated',
    'StyleProfileUpdated',
    'InstructionPackCompiled',
    'CopyAuditRun',
    'ScoutScanStarted',
    'ScoutScanCompleted',
    'OpportunityScored',
    'OpportunityDecided',
    'PreviewPostPublished',
    'LearningPageViewed',
    'LearningActionTracked',
];

const ENTITY_ID = 'camp_000001' as EntityId;

describe('EventLog', () => {
    let log: EventLog;

    beforeEach(() => {
        log = new EventLog();
    });

    describe('append()', () => {
        test('stores an event and returns it', () => {
            const ev = log.append('InterviewCaptured', ENTITY_ID, { foo: 'bar' });
            expect(ev).toBeDefined();
            expect(ev.name).toBe('InterviewCaptured');
            expect(ev.entityId).toBe(ENTITY_ID);
            expect(ev.payload).toEqual({ foo: 'bar' });
        });

        test('event has an id string', () => {
            const ev = log.append('CampaignDrafted', ENTITY_ID);
            expect(typeof ev.id).toBe('string');
            expect(ev.id.length).toBeGreaterThan(0);
        });

        test('event has a valid ISO timestamp', () => {
            const ev = log.append('FunnelPlanCreated', ENTITY_ID);
            expect(() => new Date(ev.timestamp)).not.toThrow();
            expect(new Date(ev.timestamp).toISOString()).toBe(ev.timestamp);
        });

        test('defaults payload to empty object', () => {
            const ev = log.append('VariantsGenerated', ENTITY_ID);
            expect(ev.payload).toEqual({});
        });

        test('increments count after each append', () => {
            expect(log.count()).toBe(0);
            log.append('AssetApproved', ENTITY_ID);
            expect(log.count()).toBe(1);
            log.append('AssetRejected', ENTITY_ID);
            expect(log.count()).toBe(2);
        });
    });

    describe('all()', () => {
        test('returns immutable-feeling copy (not same reference)', () => {
            log.append('ReplyDrafted', ENTITY_ID);
            const a = log.all();
            const b = log.all();
            expect(a).not.toBe(b);
            expect(a).toEqual(b);
        });

        test('returns all appended events in order', () => {
            log.append('CommentsIngested', ENTITY_ID);
            log.append('CommentClassified', ENTITY_ID);
            const events = log.all();
            expect(events[0].name).toBe('CommentsIngested');
            expect(events[1].name).toBe('CommentClassified');
        });
    });

    describe('byName()', () => {
        test('filters by event name', () => {
            log.append('ReviewBatchCreated', ENTITY_ID);
            log.append('AssetApproved', ENTITY_ID);
            log.append('ReviewBatchCreated', ENTITY_ID);
            const results = log.byName('ReviewBatchCreated');
            expect(results).toHaveLength(2);
            expect(results.every(e => e.name === 'ReviewBatchCreated')).toBe(true);
        });

        test('returns empty array for event name with no matches', () => {
            log.append('CampaignDrafted', ENTITY_ID);
            expect(log.byName('PublishDispatched')).toHaveLength(0);
        });
    });

    describe('byEntity()', () => {
        test('filters by entityId', () => {
            const other = 'brief_000002' as EntityId;
            log.append('FunnelPlanCreated', ENTITY_ID);
            log.append('VariantsScored', other);
            log.append('AttributionProjected', ENTITY_ID);
            const results = log.byEntity(ENTITY_ID);
            expect(results).toHaveLength(2);
            expect(results.every(e => e.entityId === ENTITY_ID)).toBe(true);
        });
    });

    describe('clear()', () => {
        test('removes all events', () => {
            log.append('CampaignDrafted', ENTITY_ID);
            log.clear();
            expect(log.count()).toBe(0);
            expect(log.all()).toHaveLength(0);
        });
    });

    describe('DomainEventName coverage', () => {
        test('all 28 domain event names are valid TypeScript values', () => {
            expect(ALL_EVENT_NAMES).toHaveLength(28);
        });

        test.each(ALL_EVENT_NAMES)('event "%s" can be appended to the log', (name) => {
            const localLog = new EventLog();
            const ev = localLog.append(name, ENTITY_ID);
            expect(ev.name).toBe(name);
        });
    });
});
