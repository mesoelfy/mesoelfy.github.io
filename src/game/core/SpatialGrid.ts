import { EntityID } from './ecs/types';
import { Registry } from './ecs/EntityRegistry';
import { TransformComponent } from '../components/data/TransformComponent';

export class SpatialGrid {
  private cellSize: number;
  private buckets = new Map<string, Set<EntityID>>();

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
    if (!this.buckets.has(key)) {
      this.buckets.set(key, new Set());
    }
    this.buckets.get(key)!.add(id);
  }

  /**
   * Returns a Set of EntityIDs that are in the cells near the query position.
   * This is a "Broad Phase" check. Precise collision must still be checked after.
   */
  public query(x: number, y: number, radius: number): Set<EntityID> {
    const results = new Set<EntityID>();
    
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
          for (const id of bucket) {
            results.add(id);
          }
        }
      }
    }

    return results;
  }
}
