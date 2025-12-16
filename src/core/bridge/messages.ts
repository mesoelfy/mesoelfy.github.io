export enum WorkerMessageType {
  INIT = 'INIT',
  FRAME = 'FRAME',
  INPUT = 'INPUT',
  RESIZE = 'RESIZE',
  AUDIO_EVENT = 'AUDIO_EVENT'
}

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: any;
}

export interface FrameData {
  transforms: Float32Array; // The raw buffer
  activeCount: number;
}
