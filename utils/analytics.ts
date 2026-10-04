import { track } from '@vercel/analytics';

/**
 * Safe custom event tracking for Vercel Web Analytics.
 * Strictly anonymous - does not collect any personal data (no names, phones, addresses).
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, string | number | boolean>
) => {
  try {
    track(eventName, properties);
  } catch {
    // Graceful fallback in environments without analytics
  }
};
