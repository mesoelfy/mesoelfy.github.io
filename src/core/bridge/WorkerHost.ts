import { WorkerMessage, WorkerMessageType, FrameData } from './messages';
import { TransformStore } from '@/core/ecs/TransformStore';

export class WorkerHost {
  private worker: Worker | null = null;
  private onFrameCallback: ((data: FrameData) => void) | null = null;

  public init() {
    if (typeof window === 'undefined') return;

    // We point to a separate entry file we will create
    this.worker = new Worker(new URL('./WorkerClient.ts', import.meta.url));
    
    this.worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as WorkerMessage;
      
      if (msg.type === WorkerMessageType.FRAME) {
        // Sync the Main Thread TransformStore with the Worker's snapshot
        // This effectively "teleports" the simulation state to the UI thread
        const { transforms, activeCount } = msg.payload;
        
        // We assume TransformStore.data is large enough
        if (transforms instanceof Float32Array) {
            TransformStore.data.set(transforms);
        }
        
        if (this.onFrameCallback) {
            this.onFrameCallback(msg.payload);
        }
      }
    };

    this.postMessage(WorkerMessageType.INIT);
  }

  public onFrame(cb: (data: FrameData) => void) {
    this.onFrameCallback = cb;
  }

  public sendInput(x: number, y: number) {
    this.postMessage(WorkerMessageType.INPUT, { x, y });
  }

  public updateViewport(width: number, height: number) {
    this.postMessage(WorkerMessageType.RESIZE, { width, height });
  }

  public terminate() {
    this.worker?.terminate();
  }

  private postMessage(type: WorkerMessageType, payload?: any) {
    this.worker?.postMessage({ type, payload });
  }
}
