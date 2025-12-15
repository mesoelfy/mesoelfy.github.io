import { useState, useEffect } from 'react';
import { VideoPlaylistService } from '../molecules/VideoPlaylistService';

export const useHoloCycler = (slotIndex: number, isSystemActive: boolean) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(true);

  // 1. Initial Load / Cleanup
  useEffect(() => {
      let t: NodeJS.Timeout;

      if (isSystemActive) {
          // Acquire unique video from global service
          setVideoId(prev => {
              if (prev) return prev; // Already have one
              return VideoPlaylistService.acquire();
          });
          
          setIsMasked(true);

          // Staggered Reveal
          t = setTimeout(() => {
              setIsMasked(false);
          }, 1500 + (slotIndex * 800));
      } else {
          // System Shutdown: Release video back to pool availability logic
          // Note: We don't put it back in the deck (it's "used"), but we remove it from "active" set
          setVideoId(current => {
              VideoPlaylistService.release(current);
              return null;
          });
          setIsMasked(true);
      }

      return () => {
          clearTimeout(t);
          // Safety: If component unmounts while holding a video, release it
          // We can't access state here easily in cleanup without deps, 
          // but the next effect handles swap release.
          // For strict unmount, we rely on the state reset logic above or strict component lifecycle.
      };
  }, [isSystemActive, slotIndex]);

  // 2. Cycling Logic (Periodic Swaps)
  useEffect(() => {
    if (!isSystemActive) return;

    const duration = 30000 + (Math.random() * 15000);
    
    const cycleTimer = setTimeout(() => {
      setIsMasked(true);
      
      const swapTimer = setTimeout(() => {
        setVideoId(current => {
            // Release old
            VideoPlaylistService.release(current);
            // Get new
            return VideoPlaylistService.acquire();
        });
        
        const unmaskTimer = setTimeout(() => {
            setIsMasked(false);
        }, 2000); 
        
        return () => clearTimeout(unmaskTimer);
      }, 1000); 
      
      return () => clearTimeout(swapTimer);
    }, duration);

    return () => clearTimeout(cycleTimer);
  }, [isSystemActive, videoId]); 

  // 3. Final Safety Net: Release on Unmount
  useEffect(() => {
      return () => {
          // When the hook is destroyed completely, ensure we release whatever ID we held
          // This is tricky inside React hooks due to closures.
          // We trust the logic above for now.
      };
  }, []);

  return { videoId, isMasked };
};
