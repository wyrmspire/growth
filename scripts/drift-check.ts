#!/usr/bin/env node
/**
 * BACK-2 — Contract Drift Checker
 *
 * Reads every modules/<name>/CONTRACT.md and extracts declared function names
 * from the active `## Exported Functions` section only (lines matching
 * `### functionName(`). Future or staged sections are ignored. For each
 * function, checks that a matching `export function` or `export const`
 * exists somewhere in the module's src/ directory (excluding __tests__ files).
 *
 * Exit code 0 = no drift detected.
 * Exit code 1 = one or more CONTRACT.md functions have no matching export.
 *
 * Usage:
 *   npm run check:drift
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODULES_DIR = path.join(ROOT, 'modules');

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

function getExportedFunctionsSection(content: string): string {
    const heading = /^## Exported Functions\s*$/m;
    const start = content.search(heading);

    if (start === -1) {
        return '';
    }

    const afterHeading = content.slice(start).replace(heading, '').trimStart();
    const nextSection = afterHeading.search(/^##\s+/m);

    return nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection);
}

/**
 * Extract declared function names from the active Exported Functions section
 * of a CONTRACT.md file. Future staged sections are not treated as drift.
 */
function extractContractFunctions(contractPath: string): string[] {
    const content = fs.readFileSync(contractPath, 'utf-8');
    const section = getExportedFunctionsSection(content);
    const matches = [...section.matchAll(/^###\s+(\w+)\(/gm)];
    return matches.map(m => m[1]);
}

/**
 * Return true if `fnName` has an `export function` or `export const` declaration
 * in any non-test TypeScript source file under `srcDir`.
 */
function isExportedFromSrc(fnName: string, srcDir: string): boolean {
    const tsFiles = walkDir(srcDir).filter(
        f =>
            f.endsWith('.ts') &&
            !f.includes('__tests__') &&
            !f.endsWith('.test.ts') &&
            !f.endsWith('.spec.ts'),
    );

    const patterns = [
        new RegExp(`export\\s+(async\\s+)?function\\s+${fnName}\\b`),
        new RegExp(`export\\s+const\\s+${fnName}\\s*[=:]`),
        // Re-export: export { fnName }
        new RegExp(`export\\s+\\{[^}]*\\b${fnName}\\b[^}]*\\}`),
    ];

    for (const file of tsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        if (patterns.some(p => p.test(content))) {
            return true;
        }
    }
    return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────

let exitCode = 0;

for (const moduleName of fs.readdirSync(MODULES_DIR).sort()) {
    const contractPath = path.join(MODULES_DIR, moduleName, 'CONTRACT.md');
    const srcDir = path.join(MODULES_DIR, moduleName, 'src');

    if (!fs.existsSync(contractPath) || !fs.existsSync(srcDir)) {
        continue;
    }

    const functions = extractContractFunctions(contractPath);
    for (const fn of functions) {
        if (!isExportedFromSrc(fn, srcDir)) {
            console.error(
                `[DRIFT] ${moduleName}: "${fn}" is declared in CONTRACT.md but has no matching export in src/`,
            );
            exitCode = 1;
        }
    }
}

if (exitCode === 0) {
    console.log('[OK] All active CONTRACT.md exported functions have matching exports in src/.');
}

process.exit(exitCode);
