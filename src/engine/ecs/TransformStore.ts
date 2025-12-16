import { MAX_ENTITIES } from './Constants';

const STRIDE = 4; // X, Y, ROTATION, SCALE

class TransformStoreController {
  public data = new Float32Array(MAX_ENTITIES * STRIDE);
  private freeIndices: number[] = [];
  private nextIndex = 0;

  public alloc(): number {
    if (this.freeIndices.length > 0) {
      return this.freeIndices.pop()!;
    }
    
    if (this.nextIndex >= MAX_ENTITIES) {
      // SAFETY: Return 0 (dummy slot) to prevent TypedArray crash.
      // In a real scenario, we might want to recycle the oldest entity, 
      // but preventing the crash is priority #1.
      console.error('[TransformStore] CRITICAL: Entity limit reached! Increase MAX_ENTITIES.');
      return 0; 
    }

    return this.nextIndex++;
  }

  public free(index: number) {
    this.freeIndices.push(index);
  }
}

export const TransformStore = new TransformStoreController();
