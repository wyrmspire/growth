/**
 * CORE-B1 — newEntityId() Test Suite
 */

import { newEntityId, isValidPrefix, resetIdCounter } from '../id';
import type { IdPrefix } from '../types';

const ALL_PREFIXES: IdPrefix[] = [
    'camp', 'offer', 'brief', 'copy', 'var', 'batch',
    'item', 'job', 'reply', 'comment', 'plan', 'hyp', 'sig', 'prof', 'int',
];

describe('newEntityId()', () => {
    beforeEach(() => {
        resetIdCounter();
    });

    describe('format', () => {
        test('returns a string starting with the given prefix', () => {
            const id = newEntityId('brief');
            expect(id).toMatch(/^brief_/);
        });

        test('includes a hex suffix', () => {
            const id = newEntityId('camp');
            expect(id).toMatch(/^camp_[0-9a-f]+$/);
        });
    });

    describe('uniqueness', () => {
        test('consecutive calls return different IDs', () => {
            const id1 = newEntityId('camp');
            const id2 = newEntityId('camp');
            expect(id1).not.toBe(id2);
        });

        test('generates 100 unique IDs without collision', () => {
            const ids = new Set<string>();
            for (let i = 0; i < 100; i++) {
                ids.add(newEntityId('item'));
            }
            expect(ids.size).toBe(100);
        });

        test('different prefixes produce different namespace IDs', () => {
            const briefId = newEntityId('brief');
            const campId = newEntityId('camp');
            expect(briefId).not.toBe(campId);
            expect(briefId.startsWith('brief_')).toBe(true);
            expect(campId.startsWith('camp_')).toBe(true);
        });
    });

    describe('prefix coverage', () => {
        test.each(ALL_PREFIXES)('prefix "%s" produces correct ID format', (prefix) => {
            const id = newEntityId(prefix);
            expect(id).toMatch(new RegExp(`^${prefix}_[0-9a-f]+$`));
        });
    });
});

describe('isValidPrefix()', () => {
    test('returns true for all known prefixes', () => {
        for (const prefix of ALL_PREFIXES) {
            expect(isValidPrefix(prefix)).toBe(true);
        }
    });

    test('returns false for unknown string', () => {
        expect(isValidPrefix('unknown')).toBe(false);
    });

    test('returns false for empty string', () => {
        expect(isValidPrefix('')).toBe(false);
    });

    test('is case-sensitive', () => {
        expect(isValidPrefix('BRIEF')).toBe(false);
        expect(isValidPrefix('Brief')).toBe(false);
    });
});
