/**
 * Seed the sidebar card preference for specs that exercise the cost card.
 *
 * The shipped default is `hidden` (the card lives in the settings menu), so a
 * spec that needs the sidebar trigger has to opt back into the full card. Every
 * spec clears `localStorage` in its own `beforeEach`; call this right after.
 */

import { BILLING_CARD_STORAGE_KEY, type BillingCardPrefs } from '../src/client/usage-billing-settings.ts'

/**
 * Write the full-card preference (optionally patched).
 * @param patch - preference fields to override.
 */
export function seedCardPrefs(patch: Partial<BillingCardPrefs> = {}): void {
  localStorage.setItem(BILLING_CARD_STORAGE_KEY, JSON.stringify({
    mode: 'full', metric: 'money', span: 'day', showDelta: true, ...patch,
  }))
}
