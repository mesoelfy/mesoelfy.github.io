export const MAX_ENTITIES = 5000;

// Stride: X, Y, ROTATION, SCALE
const STRIDE = 4;

class TransformStoreController {
  // The raw data buffer
  public data = new Float32Array(MAX_ENTITIES * STRIDE);
  
  private freeIndices: number[] = [];
  private nextIndex = 0;

  constructor() {
    // Initialize free indices stack if we wanted dynamic resizing, 
    // but a simple high-water mark + free list is faster for fixed size.
  }

  public alloc(): number {
    if (this.freeIndices.length > 0) {
      return this.freeIndices.pop()!;
    }
    
    if (this.nextIndex >= MAX_ENTITIES) {
      console.warn('[TransformStore] Buffer overflow! Increase MAX_ENTITIES.');
      return 0; // Fallback to 0 (Player) to avoid crash, though visuals will glitch
    }

    return this.nextIndex++;
  }

  public free(index: number) {
    // We don't necessarily need to zero-out data if allocators always reset it
    this.freeIndices.push(index);
  }

  // Batch accessors for Systems that might want raw speed later
  public getX(index: number) { return this.data[index * STRIDE]; }
  public getY(index: number) { return this.data[index * STRIDE + 1]; }
}

export const TransformStore = new TransformStoreController();
