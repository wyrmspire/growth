/**
 * evaluator.ts  (BACK-8)
 * Genkit evaluation checklist for AI coaching output.
 *
 * Checks EVERY AI output across four dimensions before it can reach the
 * human-review queue. Output that fails any check is flagged — it does
 * NOT proceed automatically, regardless of the score.
 *
 * Dimensions
 * ----------
 * quality    – Is the output coherent, complete, and actionable?
 * safety     – Does it avoid harmful, deceptive, or platform-violating content?
 * tone       – Is it beginner-friendly and non-pushy (coaching, not selling)?
 * factuality – Does it avoid fabricated statistics or unverifiable claims?
 */

export type EvalDimension = 'quality' | 'safety' | 'tone' | 'factuality';

export interface DimensionResult {
    dimension: EvalDimension;
    passed: boolean;
    score: number; // 0.0–1.0
    notes: string;
}

export interface EvalReport {
    passed: boolean;       // true only if ALL four dimensions pass
    scores: DimensionResult[];
    summary: string;
    evaluatedAt: string;
}

/**
 * Lightweight rule-based evaluator that DOES NOT require AI inference.
 * Intended for mock-safe local use; scored heuristically against the
 * raw text of the AI output string.
 *
 * In production this can be replaced with a Genkit evaluator that uses a
 * cheaper model as a judge — but the gate contract never changes.
 */
export function evaluateOutput(
    outputText: string,
    flowName: string,
): EvalReport {
    const scores: DimensionResult[] = [
        checkQuality(outputText),
        checkSafety(outputText),
        checkTone(outputText, flowName),
        checkFactuality(outputText),
    ];

    const passed = scores.every((s) => s.passed);

    return {
        passed,
        scores,
        summary: passed
            ? 'All checks passed – ready for human review.'
            : `Failed: ${scores.filter((s) => !s.passed).map((s) => s.dimension).join(', ')}. Output requires revision.`,
        evaluatedAt: new Date().toISOString(),
    };
}

// ─── Individual checks ───────────────────────────────────────────────────────

function checkQuality(text: string): DimensionResult {
    const tooShort = text.trim().length < 80;
    const hasStructure = text.includes('"') || text.includes(':');
    const score = tooShort ? 0.3 : hasStructure ? 0.9 : 0.6;
    return {
        dimension: 'quality',
        passed: score >= 0.5,
        score,
        notes: tooShort
            ? 'Output is too short to be actionable.'
            : hasStructure
                ? 'Output appears structured and complete.'
                : 'Output may lack structure.',
    };
}

const UNSAFE_PATTERNS = [
    /guarantee.*income/i,
    /get rich/i,
    /100% result/i,
    /spam/i,
    /deceiv/i,
    /fake review/i,
];

function checkSafety(text: string): DimensionResult {
    const violations = UNSAFE_PATTERNS.filter((p) => p.test(text));
    return {
        dimension: 'safety',
        passed: violations.length === 0,
        score: violations.length === 0 ? 1.0 : 0.0,
        notes:
            violations.length === 0
                ? 'No unsafe patterns detected.'
                : `Safety violations detected: ${violations.map((p) => p.source).join(', ')}`,
    };
}

const PUSHY_PATTERNS = [/buy now/i, /limited time/i, /act now/i, /don't miss out/i];
const COACHING_MARKERS = [/you decide/i, /review/i, /consider/i, /hypothesis/i, /coach/i, /your choice/i, /you approve/i];

function checkTone(text: string, _flowName: string): DimensionResult {
    const pushyHits = PUSHY_PATTERNS.filter((p) => p.test(text)).length;
    const coachingHits = COACHING_MARKERS.filter((p) => p.test(text)).length;
    const score = Math.max(0, Math.min(1, 0.5 + coachingHits * 0.1 - pushyHits * 0.3));
    return {
        dimension: 'tone',
        passed: score >= 0.5,
        score,
        notes:
            pushyHits > 0
                ? `Pushy language detected (${pushyHits} instances). Revise to coaching tone.`
                : coachingHits > 0
                    ? 'Coaching language confirms beginner-safe tone.'
                    : 'Tone is neutral — add coaching cues for clarity.',
    };
}

const FABRICATION_PATTERNS = [
    /\d+%\s+of\s+(?:all\s+)?(?:people|users|businesses|marketers)/i,
    /studies show/i,
    /research proves/i,
];

function checkFactuality(text: string): DimensionResult {
    const risk = FABRICATION_PATTERNS.filter((p) => p.test(text));
    return {
        dimension: 'factuality',
        passed: risk.length === 0,
        score: risk.length === 0 ? 1.0 : 0.4,
        notes:
            risk.length === 0
                ? 'No unverifiable statistics or fabricated claims detected.'
                : `Potential fabrication risk: "${risk[0]?.source}". Verify before use.`,
    };
}
