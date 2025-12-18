import { useGameContext } from '@/engine/state/GameContext';
import { IAudioService } from '@/engine/interfaces';

export const useAudio = (): IAudioService => {
  const { audio } = useGameContext();
  return audio;
};
