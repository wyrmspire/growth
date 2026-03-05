#!/usr/bin/env node
/**
 * BACK-3 — Import Boundary Lint
 *
 * Enforces that each module only imports from its declared dependencies.
 * Uses the allowed-peer map below as the source of truth, which mirrors the
 * "Depends on" lines in each modules/<name>/CONTRACT.md.
 *
 * Scans every non-test TypeScript file in modules/<name>/src/ and reports
 * any import that references a module not in the allowed list.
 *
 * Exit code 0 = all boundaries clean.
 * Exit code 1 = one or more boundary violations found.
 *
 * Usage:
 *   npx tsx scripts/lint-boundaries.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODULES_DIR = path.join(ROOT, 'modules');

// ─── Allowed dependency map ───────────────────────────────────────────────
//
// Format: { moduleName: string[] } where the array lists every module that
// the given module is allowed to import from.
//
// Note: Genkit flow files in strategy/copylab/comments may also import from
// genkit-shared (added as part of BACK-6). Only our internal module names
// are checked — external npm packages like @genkit-ai/* are ignored.

const ALLOWED_PEERS: Record<string, readonly string[]> = {
    core: [],
    funnel: ['core'],
    strategy: ['core', 'analytics', 'adapters', 'genkit-shared'],
    copylab: ['core', 'funnel', 'genkit-shared'],
    approvals: ['core'],
    adapters: ['core'],
    publishing: ['core', 'approvals', 'adapters'],
    comments: ['core', 'approvals', 'adapters', 'genkit-shared'],
    analytics: ['core'],
    'genkit-shared': ['core'],
};

/** All module names we own — used to skip external npm package references. */
const KNOWN_MODULES = new Set(Object.keys(ALLOWED_PEERS));

// ─── Helpers ──────────────────────────────────────────────────────────────

function walkDir(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(full));
        } else {
            results.push(full);
        }
    }
    return results;
}

/**
 * Extract the module names referenced in import/from statements.
 *
 * Recognises two forms:
 *   1. Path alias: `from '@moduleName/...'`
 *   2. Relative cross-module: `from '../../moduleName/src/...'`
 */
function importedModules(content: string): string[] {
    const found = new Set<string>();

    // @alias imports  e.g.  from '@core/types'
    for (const m of content.matchAll(/from\s+['"]@([a-z-]+)\//g)) {
        found.add(m[1]);
    }

    // Relative cross-module imports  e.g.  from '../../core/src/types'
    for (const m of content.matchAll(/from\s+['"][^'"]*?\/([a-z-]+)\/src\//g)) {
        found.add(m[1]);
    }

    return [...found];
}

// ─── Main ─────────────────────────────────────────────────────────────────

let exitCode = 0;

for (const moduleName of fs.readdirSync(MODULES_DIR).sort()) {
    const srcDir = path.join(MODULES_DIR, moduleName, 'src');
    if (!fs.existsSync(srcDir)) continue;

    const allowed = ALLOWED_PEERS[moduleName];
    if (allowed === undefined) {
        // Unknown module — skip silently (could be a new addition not yet registered)
        continue;
    }

    const tsFiles = walkDir(srcDir).filter(
        f =>
            f.endsWith('.ts') &&
            !f.includes('__tests__') &&
            !f.endsWith('.test.ts') &&
            !f.endsWith('.spec.ts'),
    );

    for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const refs = importedModules(content);
        const relPath = path.relative(path.join(MODULES_DIR, moduleName), file);

        for (const ref of refs) {
            if (ref === moduleName) continue; // self-import is fine
            if (!KNOWN_MODULES.has(ref)) continue; // external npm package — not our concern
            if (!allowed.includes(ref)) {
                console.error(
                    `[BOUNDARY] ${moduleName}/${relPath}: imports "@${ref}" — ` +
                    `not in allowed list [${allowed.join(', ') || '(none)'}]`,
                );
                exitCode = 1;
            }
        }
    }
}

if (exitCode === 0) {
    console.log('[OK] All module import boundaries are clean.');
}

process.exit(exitCode);
