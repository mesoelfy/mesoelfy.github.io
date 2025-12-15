import { EntityID } from './types';
import { MAX_ENTITIES, SPATIAL_GRID_SIZE, SPATIAL_CELL_SIZE } from './Constants';

// Primes for Hashing
const HASH_X = 73856093;
const HASH_Y = 19349663;

export class SpatialGrid {
  // Head of the linked list for each cell
  // cellHead[cellHash] = firstEntityId (or -1 if empty)
  private cellHead = new Int32Array(SPATIAL_GRID_SIZE);

  // Next pointer for each entity
  // entityNext[entityId] = nextEntityId (or -1 if end of list)
  private entityNext = new Int32Array(MAX_ENTITIES);

  constructor() {
    this.cellHead.fill(-1);
    this.entityNext.fill(-1);
  }

  public clear() {
    // Only reset heads. entityNext is overwritten on insert.
    this.cellHead.fill(-1);
  }

  private getHash(x: number, y: number): number {
    const cx = Math.floor(x / SPATIAL_CELL_SIZE);
    const cy = Math.floor(y / SPATIAL_CELL_SIZE);
    return ((cx * HASH_X) ^ (cy * HASH_Y)) & (SPATIAL_GRID_SIZE - 1);
  }

  public insert(id: EntityID, x: number, y: number) {
    const eid = id as number;
    // Bounds check
    if (eid >= MAX_ENTITIES || eid < 0) return;

    const hash = this.getHash(x, y);

    // Prepend to linked list
    this.entityNext[eid] = this.cellHead[hash];
    this.cellHead[hash] = eid;
  }

  /**
   * Zero-GC Query
   * Writes results into 'outArray'.
   * Returns the number of results found.
   */
  public query(x: number, y: number, radius: number, outArray: Int32Array): number {
    let count = 0;
    const max = outArray.length;
    
    // Scan range
    const startX = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
    const endX = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
    const startY = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
    const endY = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

    // To prevent duplicates if an entity spans multiple cells,
    // we strictly rely on the fact that insert() puts an entity in ONE cell (center point).
    // This implies point-based spatial hashing (buckets), not bounds-based.
    // So we check all buckets the query radius touches.
    
    for (let cy = startY; cy <= endY; cy++) {
      for (let cx = startX; cx <= endX; cx++) {
        const hash = ((cx * HASH_X) ^ (cy * HASH_Y)) & (SPATIAL_GRID_SIZE - 1);
        
        let id = this.cellHead[hash];
        
        while (id !== -1) {
          if (count < max) {
            outArray[count++] = id;
          }
          id = this.entityNext[id];
        }
      }
    }
    
    return count;
  }
}
