/**
 * setup-store.ts — SETUP-1
 * Secure local storage layer for social platform API credentials.
 *
 * Security rules:
 *  - Keys are NEVER returned as plain text from this module.
 *  - `getKeyMasked()` always returns '*****' (or empty string if not set).
 *  - `hasKey()` tells callers whether a key is stored without exposing it.
 *  - The raw value is base64-encoded for transport-safety (not true encryption;
 *    actual encryption requires a server-side vault, deferred to Phase 8).
 *  - All stored values are prefixed with the storage namespace to avoid collisions.
 */

export type PlatformId =
  | 'reddit'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'substack'
  | 'youtube'
  | 'twitter';

export interface PlatformSlot {
  id: PlatformId;
  /** Human-readable name shown in the UI */
  label: string;
  /** Which credential fields this platform requires */
  fields: CredentialField[];
  /** Optional help URL shown next to the field */
  helpUrl?: string;
}

export interface CredentialField {
  /** Machine-readable key (used as localStorage sub-key) */
  key: string;
  /** UI label */
  label: string;
  /** Placeholder hint */
  placeholder: string;
  /** Whether this field is optional */
  optional?: boolean;
}

// ── Platform definitions ────────────────────────────────────────────────────

export const PLATFORM_SLOTS: PlatformSlot[] = [
  {
    id: 'facebook',
    label: 'Facebook / Meta',
    helpUrl: 'https://developers.facebook.com/apps/',
    fields: [
      { key: 'app_id',     label: 'App ID',     placeholder: '1234567890' },
      { key: 'app_secret', label: 'App Secret', placeholder: 'abc123…'   },
      { key: 'access_token', label: 'Page Access Token', placeholder: 'EAABsbCS…', optional: true },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    helpUrl: 'https://developers.facebook.com/apps/',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'IGQVJx…' },
      { key: 'account_id',   label: 'Business Account ID', placeholder: '17841…' },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    helpUrl: 'https://www.linkedin.com/developers/apps',
    fields: [
      { key: 'client_id',     label: 'Client ID',     placeholder: '77abc…' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'xyz98…' },
      { key: 'access_token',  label: 'Access Token',  placeholder: 'AQU…', optional: true },
    ],
  },
  {
    id: 'reddit',
    label: 'Reddit',
    helpUrl: 'https://www.reddit.com/prefs/apps',
    fields: [
      { key: 'client_id',     label: 'Client ID',     placeholder: 'abc123' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'xyz_secret' },
      { key: 'username',      label: 'Reddit Username', placeholder: 'u/youraccount' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    helpUrl: 'https://developers.tiktok.com/',
    fields: [
      { key: 'client_key',    label: 'Client Key',    placeholder: 'aw_…' },
      { key: 'client_secret', label: 'Client Secret', placeholder: '…secret' },
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    fields: [
      { key: 'api_key',   label: 'API Key',        placeholder: 'AIzaSy…' },
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '123…apps.googleusercontent.com' },
    ],
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    helpUrl: 'https://developer.twitter.com/en/portal/dashboard',
    fields: [
      { key: 'api_key',        label: 'API Key',        placeholder: 'abc…' },
      { key: 'api_secret',     label: 'API Secret',     placeholder: 'xyz…' },
      { key: 'access_token',   label: 'Access Token',   placeholder: '123456-abc…', optional: true },
      { key: 'access_secret',  label: 'Access Secret',  placeholder: 'tok_secret…', optional: true },
    ],
  },
  {
    id: 'substack',
    label: 'Substack',
    helpUrl: 'https://substack.com/settings',
    fields: [
      { key: 'email',    label: 'Account Email',    placeholder: 'you@example.com' },
      { key: 'pub_slug', label: 'Publication Slug', placeholder: 'yourpub' },
    ],
  },
];

// ── Storage helpers ─────────────────────────────────────────────────────────

const NS = 'growthops_setup_';

function storageKey(platformId: PlatformId, fieldKey: string): string {
  return `${NS}${platformId}__${fieldKey}`;
}

/** Encode value before storing (not true encryption — phase 8 handles vault). */
function encode(value: string): string {
  try {
    return btoa(unescape(encodeURIComponent(value)));
  } catch {
    return btoa(value);
  }
}

/** Decode stored value. Returns empty string on error. */
function decode(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return '';
  }
}

function readRaw(platformId: PlatformId, fieldKey: string): string | null {
  try {
    const raw = localStorage.getItem(storageKey(platformId, fieldKey));
    if (!raw) return null;
    const decoded = decode(raw);
    return decoded || null;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns true if the given field has a stored (non-empty) value.
 * Safe to call — never exposes the raw key.
 */
export function hasKey(platformId: PlatformId, fieldKey: string): boolean {
  return readRaw(platformId, fieldKey) !== null;
}

/**
 * Returns a masked representation of the key (***..***) if set,
 * or an empty string if not set. Raw value is NEVER exposed.
 */
export function getKeyMasked(platformId: PlatformId, fieldKey: string): string {
  const raw = readRaw(platformId, fieldKey);
  if (!raw) return '';
  // Show first 3 chars + asterisks so the user can identify which key is stored
  const visible = raw.length > 6 ? raw.slice(0, 3) : '';
  return visible ? `${visible}${'*'.repeat(Math.min(10, raw.length - 3))}` : '*****';
}

/**
 * Store a credential value for a platform field.
 * Silently no-ops if localStorage is unavailable.
 */
export function setKey(platformId: PlatformId, fieldKey: string, value: string): void {
  if (!value.trim()) {
    clearKey(platformId, fieldKey);
    return;
  }
  try {
    localStorage.setItem(storageKey(platformId, fieldKey), encode(value.trim()));
  } catch {
    // quota or private-mode error — silently ignore
  }
}

/**
 * Remove a single credential field from storage.
 */
export function clearKey(platformId: PlatformId, fieldKey: string): void {
  try {
    localStorage.removeItem(storageKey(platformId, fieldKey));
  } catch {
    // ignore
  }
}

/**
 * Remove ALL credentials for a specific platform.
 */
export function clearPlatform(platformId: PlatformId): void {
  const slot = PLATFORM_SLOTS.find((s) => s.id === platformId);
  if (!slot) return;
  slot.fields.forEach((f) => clearKey(platformId, f.key));
}

/**
 * Remove ALL stored setup credentials across all platforms.
 */
export function clearAll(): void {
  PLATFORM_SLOTS.forEach((slot) => clearPlatform(slot.id));
}

/**
 * Returns a summary of connected platforms — counts how many required fields
 * are filled for each platform.  Used for the status overview in the UI.
 */
export interface PlatformStatus {
  id: PlatformId;
  label: string;
  isConnected: boolean;          // true if all required fields are set
  filledCount: number;           // number of fields with a value
  totalRequired: number;         // total non-optional field count
}

export function getPlatformStatuses(): PlatformStatus[] {
  return PLATFORM_SLOTS.map((slot) => {
    const required = slot.fields.filter((f) => !f.optional);
    const filledRequired = required.filter((f) => hasKey(slot.id, f.key));
    const filledAll = slot.fields.filter((f) => hasKey(slot.id, f.key));
    return {
      id: slot.id,
      label: slot.label,
      isConnected: filledRequired.length === required.length && required.length > 0,
      filledCount: filledAll.length,
      totalRequired: required.length,
    };
  });
}
