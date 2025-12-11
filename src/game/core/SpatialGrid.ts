import { EntityID } from './ecs/types';

// Configuration for Integer Hashing
// World is roughly -20 to +20. Offset ensures positive indices.
const CELL_SIZE = 4;
const OFFSET = 1000; 
const Y_STRIDE = 10000; // Multiplier for Y to avoid X collisions

export class SpatialGrid {
  // Using Map<number, EntityID[]> avoids string conversion
  private buckets = new Map<number, EntityID[]>(); 

  public clear() {
    // Soft Clear: Reuse arrays to avoid Garbage Collection
    for (const bucket of this.buckets.values()) {
      bucket.length = 0;
    }
  }

  private getKey(x: number, y: number): number {
    // Floor and offset
    const cx = Math.floor((x + OFFSET) / CELL_SIZE);
    const cy = Math.floor((y + OFFSET) / CELL_SIZE);
    
    // Unique Integer Key: Y * Width + X
    return (cy * Y_STRIDE) + cx;
  }

  public insert(id: EntityID, x: number, y: number) {
    const key = this.getKey(x, y);
    
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = []; 
      this.buckets.set(key, bucket);
    }
    bucket.push(id);
  }

  /**
   * Optimized Query.
   * Populates the provided Set to avoid allocation.
   */
  public query(x: number, y: number, radius: number, outResults: Set<EntityID>) {
    outResults.clear();
    
    const startX = Math.floor((x - radius + OFFSET) / CELL_SIZE);
    const endX = Math.floor((x + radius + OFFSET) / CELL_SIZE);
    const startY = Math.floor((y - radius + OFFSET) / CELL_SIZE);
    const endY = Math.floor((y + radius + OFFSET) / CELL_SIZE);

    for (let cy = startY; cy <= endY; cy++) {
      // Pre-calculate Y offset for the inner loop
      const yHash = cy * Y_STRIDE;
      
      for (let cx = startX; cx <= endX; cx++) {
        const key = yHash + cx;
        const bucket = this.buckets.get(key);
        
        if (bucket) {
          // Classic loop is faster than for..of
          const len = bucket.length;
          for (let i = 0; i < len; i++) {
            outResults.add(bucket[i]);
          }
        }
      }
    }
  }
}
