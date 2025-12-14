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
      console.warn('[TransformStore] Buffer overflow!');
      return 0; 
    }

    return this.nextIndex++;
  }

  public free(index: number) {
    this.freeIndices.push(index);
  }
}

export const TransformStore = new TransformStoreController();
