import { useState, useEffect } from 'react';
import { GameStream, StreamKey } from '@/engine/state/GameStream';

export const useStreamValue = (key: StreamKey): number => {
  const [value, setValue] = useState(GameStream.get(key));

  useEffect(() => {
    // Sync initial value
    setValue(GameStream.get(key));
    return GameStream.subscribe(key, setValue);
  }, [key]);

  return value;
};
