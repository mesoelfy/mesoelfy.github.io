export const BOOT_SEQUENCE = {
  TIMINGS: {
    INIT: 1500,            // Faster "CONNECTED" + Rain
    LINK: 5500,            // Long pause before "MOUNT"
    SECURITY_CHECK: 7500,  // Fast jump to "UNSAFE"
    BYPASS: 11500,         // Long hold on "UNSAFE" (Red)
    DECRYPT: 13500,        // "DECRYPTED"
    READY: 14500           // "CAUTION" + Triangles
  },
  COMPLETION_DELAY: 500
};
