/**
 * supabase-client.ts — FW-10
 * Supabase connection scaffold for GrowthOps OS.
 *
 * Phase: P10 (Production Hardening & Launch Readiness)
 * Status: STUB — @supabase/supabase-js is NOT installed yet.
 *
 * This file defines the connection-check pattern so that future sprints
 * (P10) can install the package and wire a real client without restructuring
 * existing call sites.
 *
 * Usage (future, after `npm install @supabase/supabase-js`):
 *   Replace the stub below with the real client creation and update the
 *   return type to `SupabaseClient | null`.
 *
 * Environment variables required (add to .env.local):
 *   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<your-anon-key>
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientStub = Record<string, any>;

/** Cached env check result. */
let _checked = false;
let _configured = false;

function checkEnv(): boolean {
  if (_checked) return _configured;
  _checked = true;

  const env = (import.meta as unknown as { env: Record<string, string> }).env;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;

  _configured = Boolean(url && key);
  return _configured;
}

/**
 * Returns whether both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 * Does not verify that the values are valid — just that they are non-empty.
 */
export function isSupabaseConfigured(): boolean {
  return checkEnv();
}

/**
 * Returns a Supabase client instance, or `null` if the required environment
 * variables are missing or the package is not yet installed.
 *
 * Call sites should guard against null before making any database calls:
 *
 * ```ts
 * const db = getSupabaseClient();
 * if (!db) { return; } // fall back to mock-engine
 * const { data } = await db.from('projects').select('*');
 * ```
 *
 * @returns null (stub). Will return a real SupabaseClient in Sprint 8 / P10.
 */
export function getSupabaseClient(): SupabaseClientStub | null {
  const configured = checkEnv();

  if (!configured) {
    console.info('Supabase not configured — running in local-only mode');
    return null;
  }

  // ─── Replace this block when @supabase/supabase-js is installed ──────────
  // import { createClient } from '@supabase/supabase-js';
  // return createClient(url, key);
  // ─────────────────────────────────────────────────────────────────────────

  console.info('Supabase configured but client not installed — install @supabase/supabase-js in Sprint 8');
  return null;
}
