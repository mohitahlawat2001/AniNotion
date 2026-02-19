/**
 * Feature Flags
 *
 * Central place to enable/disable UI features.
 * Each flag can be overridden via the corresponding VITE_ environment variable.
 *
 * Usage in .env / .env.local:
 *   VITE_SHOW_PREMIUM_SIDEBAR=true    → shows the "Go Premium" upgrade sidebar
 *   VITE_SHOW_PREMIUM_SIDEBAR=false   → hides the "Go Premium" upgrade sidebar (default)
 */

/**
 * Whether to show the "Go Premium" upgrade sidebar to authenticated non-premium users.
 * Set VITE_SHOW_PREMIUM_SIDEBAR=true in your .env to show it.
 * @type {boolean}
 */
export const SHOW_PREMIUM_SIDEBAR =
  import.meta.env.VITE_SHOW_PREMIUM_SIDEBAR === 'true';
