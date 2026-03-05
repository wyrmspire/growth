/**
 * index.ts
 * Public surface of the genkit-shared module.
 * Import from here rather than reaching into individual files.
 */

export { ai, resolveModel, LIVE_MODEL } from './genkit-init.js';
export { MockResponses } from './mock-model.js';
export { evaluateOutput } from './evaluator.js';
export type { EvalReport, EvalDimension, DimensionResult } from './evaluator.js';
export {
    createReviewItem,
    approveReviewItem,
    rejectReviewItem,
    assertHumanApproved,
    isApproved,
} from './human-review-gate.js';
export type { ReviewItem, ReviewStatus } from './human-review-gate.js';
