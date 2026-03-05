import type { ApprovalState, AppError } from './types';

export function assertApprovalState(
    actual: ApprovalState,
    required: ApprovalState,
): { ok: boolean; error?: AppError } {
    if (actual === required) {
        return { ok: true };
    }
    return {
        ok: false,
        error: {
            code: 'APPROVAL_STATE_MISMATCH',
            message: `Required state "${required}" but found "${actual}".`,
            module: 'core',
        },
    };
}
