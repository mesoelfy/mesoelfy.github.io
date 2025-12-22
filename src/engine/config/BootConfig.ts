export const BOOT_SEQUENCE = {
  TIMINGS: {
    INIT: 1500,            // Log 2 (CONNECTED)
    LINK: 3500,            // Log 3 (MOUNT) - Gap halved (was 5500)
    SECURITY_CHECK: 6500,  // Log 4 (UNSAFE) - Waits for 2 blink cycles
    BYPASS: 9700,          // Log 5 (BYPASS) - Unsafe lasts 20% shorter (was 4000 gap -> 3200)
    DECRYPT: 11700,        // Log 6
    READY: 12700           // Log 7
  },
  COMPLETION_DELAY: 500
};
