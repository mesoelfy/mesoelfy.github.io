/**
 * CONSOLE_SCRUBBER // NOISE_REDUCTION_PROTOCOL
 * Silences common third-party noise (YouTube, Ad-Blockers) 
 * to keep the kernel logs clean.
 */
export const initializeConsoleScrubber = () => {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  // Pattern match for junk logs
  const JUNK_PATTERNS = [
    'net::ERR_BLOCKED_BY_CLIENT',
    'www-embed-player.js',
    'base.js',
    'Failed to load resource',
    'YouTube'
  ];

  console.error = (...args: any[]) => {
    const msg = args[0]?.toString() || '';
    if (JUNK_PATTERNS.some(pattern => msg.includes(pattern))) {
      return; // Packet Dropped
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const msg = args[0]?.toString() || '';
    if (JUNK_PATTERNS.some(pattern => msg.includes(pattern))) {
      return; // Packet Dropped
    }
    originalWarn.apply(console, args);
  };

  console.log("%c// LOG_SCRUBBER: ACTIVE // NOISE_REDUCTION: ENABLED", "color: #78F654; font-weight: bold;");
};
