import { useEffect, useRef } from 'react';
import { GameStream, StreamKey } from '@/engine/state/GameStream';

/**
 * Subscribes to a high-frequency value.
 * @param key The data key to listen for
 * @param callback The function to run when data changes (updates DOM directly)
 */
export const useGameStream = (key: StreamKey, callback: (value: number) => void) => {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return GameStream.subscribe(key, (val) => {
      cbRef.current(val);
    });
  }, [key]);
};

/**
 * Helper: Binds text content directly
 */
export const useStreamText = (key: StreamKey, ref: React.RefObject<HTMLElement>, format?: (v: number) => string) => {
  useGameStream(key, (val) => {
    if (ref.current) {
      ref.current.innerText = format ? format(val) : Math.floor(val).toString();
    }
  });
};
