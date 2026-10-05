import { track as vercelTrack } from '@vercel/analytics';

/**
 * Safe custom event tracking for Vercel Web Analytics.
 * Strictly anonymous - does not collect any personal data (no names, phones, addresses).
 */
export const track = (
  eventName: string,
  properties?: Record<string, string | number | boolean>
) => {
  try {
    if (typeof window !== 'undefined') {
      vercelTrack(eventName, properties);
    }
  } catch {
    // Graceful fallback in environments without analytics
  }
};

export const trackEvent = track;

