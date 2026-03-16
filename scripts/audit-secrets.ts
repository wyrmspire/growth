/**
 * audit-secrets.ts — W4
 * Build the production bundle and scan for leaked credentials.
 *
 * Usage: npx tsx scripts/audit-secrets.ts
 *
 * Exit 0: clean
 * Exit 1: potential credential leak found
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ── Credential patterns to search for ──────────────────────────────────────
// These are env var names and patterns that should NEVER appear in client JS.
const LITERAL_PATTERNS = [
    'META_ACCESS_TOKEN',
    'LINKEDIN_ACCESS_TOKEN',
    'X_API_KEY',
    'X_API_SECRET',
    'SMTP_HOST',
    'SMTP_PASS',
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'TIKTOK_CLIENT_KEY',
    'TIKTOK_CLIENT_SECRET',
    'INSTAGRAM_ACCESS_TOKEN',
    'YOUTUBE_API_KEY',
    'SUBSTACK_API_TOKEN',
    'GEMINI_API_KEY',
];

// Regex patterns for things that look like leaked secrets
const REGEX_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
    {
        pattern: /(?:api[_-]?key|api[_-]?secret|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/gi,
        description: 'Hardcoded credential assignment',
    },
    {
        // Base64 strings > 40 chars that aren't CSS data URIs or source-map comments
        pattern: /(?<!data:image\/|sourceMappingURL=)[A-Za-z0-9+/]{40,}={0,2}(?=["'])/g,
        description: 'Long base64 string (possible leaked token)',
    },
];

// ── Build ─────────────────────────────────────────────────────────────────
console.log('[audit-secrets] Running production build...');
try {
    execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() });
    console.log('[audit-secrets] Build succeeded.');
} catch (err) {
    console.error('[audit-secrets] Build failed:', (err as Error).message);
    process.exit(1);
}

// ── Scan output files ─────────────────────────────────────────────────────
const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
    console.error('[audit-secrets] dist/ directory not found after build.');
    process.exit(1);
}

function getAllJsFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...getAllJsFiles(full));
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) {
            results.push(full);
        }
    }
    return results;
}

const jsFiles = getAllJsFiles(distDir);
console.log(`[audit-secrets] Scanning ${jsFiles.length} JS file(s) in dist/...`);

let totalFindings = 0;

for (const filePath of jsFiles) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relPath = path.relative(process.cwd(), filePath);

    // Check literal patterns
    for (const pattern of LITERAL_PATTERNS) {
        if (content.includes(pattern)) {
            // Filter out false positives: env var NAMES in process.env.XXX are fine
            // if they appear as string literals though, that's a problem
            const occurrences = content.split(pattern).length - 1;
            console.error(`  ⚠ FOUND "${pattern}" in ${relPath} (${occurrences} occurrence(s))`);
            totalFindings++;
        }
    }

    // Check regex patterns
    for (const { pattern, description } of REGEX_PATTERNS) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
            // Filter out common false positives (CSS hashes, chunk names)
            const realMatches = matches.filter(m => {
                // Skip short matches and common build artifacts
                if (m.length < 40) return false;
                // Skip common hash-like strings from bundler
                if (/^[a-f0-9]+$/i.test(m)) return false;
                return true;
            });
            if (realMatches.length > 0) {
                console.error(`  ⚠ ${description}: ${realMatches.length} match(es) in ${relPath}`);
                totalFindings++;
            }
        }
    }
}

// ── Summary ───────────────────────────────────────────────────────────────
if (totalFindings > 0) {
    console.error(`\n[audit-secrets] ❌ FOUND ${totalFindings} potential credential leak(s) in the production bundle.`);
    console.error('[audit-secrets] Review the findings above and remove any hardcoded secrets.');
    process.exit(1);
} else {
    console.log(`\n[audit-secrets] ✅ No credential leaks detected in ${jsFiles.length} JS file(s).`);
    process.exit(0);
}
