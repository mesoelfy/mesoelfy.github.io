import { ServiceLocator } from '@/engine/services/ServiceLocator';
import { IAudioService } from '@/engine/interfaces';
import { AudioServiceImpl } from '@/engine/audio/AudioService';
import { useMemo } from 'react';

export const useAudio = (): IAudioService => {
  const audio = useMemo(() => {
    try {
        // Try to get existing instance
        return ServiceLocator.getAudioService();
    } catch {
        // If missing (UI loaded before Engine), create and register it now.
        // This ensures components always get a working service.
        const impl = new AudioServiceImpl();
        ServiceLocator.register('AudioService', impl);
        return impl;
    }
  }, []);

  return audio;
};
