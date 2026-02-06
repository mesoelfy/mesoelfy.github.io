import { useState, useEffect } from 'react';
import { VideoPlaylistService, VideoDef } from '../molecules/VideoPlaylistService';

export const useHoloCycler = (slotIndex: number, isSystemActive: boolean) => {
  const [currentVideo, setCurrentVideo] = useState<VideoDef | null>(null);
  const [isMasked, setIsMasked] = useState(true);

  // 1. Initial Load / Cleanup
  useEffect(() => {
      let t: NodeJS.Timeout;

      if (isSystemActive) {
          // Acquire unique video from global service
          setCurrentVideo(prev => {
              if (prev) return prev; // Already have one
              return VideoPlaylistService.acquire();
          });
          
          setIsMasked(true);

          // Staggered Reveal on boot
          t = setTimeout(() => {
              setIsMasked(false);
          }, 1500 + (slotIndex * 800));
      } else {
          // System Shutdown: Release video back to pool
          setCurrentVideo(curr => {
              if (curr) VideoPlaylistService.release(curr.id);
              return null;
          });
          setIsMasked(true);
      }

      return () => clearTimeout(t);
  }, [isSystemActive, slotIndex]);

  // 2. Cycling Logic (Exact Durations)
  useEffect(() => {
    if (!isSystemActive || !currentVideo) return;

    // Config Duration = Real Length + 2000ms buffer.
    // Goal: Trigger mask 0.5s BEFORE Real Length ends.
    // Formula: (Duration - 2000) - 500 = Duration - 2500.
    const maskTriggerTime = Math.max(1000, currentVideo.duration - 2500);
    
    const cycleTimer = setTimeout(() => {
      // 1. Trigger "Establishing Uplink" Overlay
      // (CSS transition takes 500ms, so it will be fully opaque exactly when video ends)
      setIsMasked(true);
      
      // 2. Swap Video Source (Behind the mask)
      const swapTimer = setTimeout(() => {
        setCurrentVideo(curr => {
            // Release old
            if (curr) VideoPlaylistService.release(curr.id);
            // Get new
            return VideoPlaylistService.acquire();
        });
        
        // 3. Reveal New Video
        const unmaskTimer = setTimeout(() => {
            setIsMasked(false);
        }, 1500); // Wait 1.5s total for "connecting" effect
        
        return () => clearTimeout(unmaskTimer);
      }, 1000); // Wait 1s after mask trigger to ensure opacity is 100%
      
      return () => clearTimeout(swapTimer);
    }, maskTriggerTime);

    return () => clearTimeout(cycleTimer);
  }, [isSystemActive, currentVideo]); 

  // 3. Final Safety Net
  useEffect(() => {
      return () => {
          // Strict cleanup handled by logic above
      };
  }, []);

  return { videoId: currentVideo?.id || null, isMasked };
};
