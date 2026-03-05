/**
 * CORE-A3 — assertApprovalState() Test Suite
 */

import { assertApprovalState } from '../approval-gate';
import type { ApprovalState } from '../types';

describe('assertApprovalState()', () => {
    describe('matching states', () => {
        test('returns ok=true when actual matches required', () => {
            const result = assertApprovalState('approved', 'approved');
            expect(result.ok).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('pending matches pending', () => {
            const result = assertApprovalState('pending', 'pending');
            expect(result.ok).toBe(true);
        });

        test('rejected matches rejected', () => {
            const result = assertApprovalState('rejected', 'rejected');
            expect(result.ok).toBe(true);
        });

        test('reopened matches reopened', () => {
            const result = assertApprovalState('reopened', 'reopened');
            expect(result.ok).toBe(true);
        });
    });

    describe('mismatched states', () => {
        test('returns ok=false and error when states differ', () => {
            const result = assertApprovalState('pending', 'approved');
            expect(result.ok).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('error code is APPROVAL_STATE_MISMATCH', () => {
            const result = assertApprovalState('pending', 'approved');
            expect(result.error?.code).toBe('APPROVAL_STATE_MISMATCH');
        });

        test('error module is core', () => {
            const result = assertApprovalState('pending', 'approved');
            expect(result.error?.module).toBe('core');
        });

        test('error message names both states', () => {
            const result = assertApprovalState('rejected', 'approved');
            expect(result.error?.message).toContain('approved');
            expect(result.error?.message).toContain('rejected');
        });
    });

    describe('all cross-state pairs with approved required (guard for publish/send)', () => {
        const nonApproved: ApprovalState[] = ['pending', 'rejected', 'reopened'];
        for (const state of nonApproved) {
            test(`blocks when actual="${state}" and required="approved"`, () => {
                const result = assertApprovalState(state, 'approved');
                expect(result.ok).toBe(false);
            });
        }
    });
});
