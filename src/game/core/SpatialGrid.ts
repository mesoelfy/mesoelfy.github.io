import { EntityID } from './ecs/types';

export class SpatialGrid {
  private cellSize: number;
  private buckets = new Map<string, EntityID[]>(); // Changed Set to Array for faster iteration

  constructor(cellSize: number = 4) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx}:${cy}`;
  }

  public clear() {
    this.buckets.clear();
  }

  public insert(id: EntityID, x: number, y: number) {
    const key = this.getKey(x, y);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = []; // Simple array, cleaner than Set for iteration
      this.buckets.set(key, bucket);
    }
    bucket.push(id);
  }

  /**
   * Zero-Allocation Query.
   * Populates the provided 'outResults' Set with neighbors.
   */
  public query(x: number, y: number, radius: number, outResults: Set<EntityID>) {
    outResults.clear();
    
    // Calculate range of cells to check
    const startX = Math.floor((x - radius) / this.cellSize);
    const endX = Math.floor((x + radius) / this.cellSize);
    const startY = Math.floor((y - radius) / this.cellSize);
    const endY = Math.floor((y + radius) / this.cellSize);

    for (let cx = startX; cx <= endX; cx++) {
      for (let cy = startY; cy <= endY; cy++) {
        const key = `${cx}:${cy}`;
        const bucket = this.buckets.get(key);
        if (bucket) {
          const len = bucket.length;
          for (let i = 0; i < len; i++) {
            outResults.add(bucket[i]);
          }
        }
      }
    }
  }
}
