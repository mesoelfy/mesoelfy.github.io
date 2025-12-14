import { EntityID } from './ecs/types';
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
    // We only need to reset the heads to "Empty"
    // The 'entityNext' values will be overwritten on insert, so no need to loop 10k items.
    this.cellHead.fill(-1);
  }

  /**
   * Spatial Hash Function (2D -> 1D Index)
   */
  private getHash(x: number, y: number): number {
    const cx = Math.floor(x / SPATIAL_CELL_SIZE);
    const cy = Math.floor(y / SPATIAL_CELL_SIZE);
    
    // XOR Hash mapped to Grid Size (Power of 2 for bitwise AND)
    const hash = ((cx * HASH_X) ^ (cy * HASH_Y)) & (SPATIAL_GRID_SIZE - 1);
    return hash;
  }

  public insert(id: EntityID, x: number, y: number) {
    const eid = id as number;
    if (eid >= MAX_ENTITIES) return; // Safety check

    const hash = this.getHash(x, y);

    // Linked List Insertion (Prepend)
    // 1. Point current entity to whatever was previously first
    this.entityNext[eid] = this.cellHead[hash];
    
    // 2. Make current entity the new first
    this.cellHead[hash] = eid;
  }

  public query(x: number, y: number, radius: number, outResults: Set<EntityID>) {
    outResults.clear();
    
    const startX = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
    const endX = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
    const startY = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
    const endY = Math.floor((y + radius) / SPATIAL_CELL_SIZE);

    for (let cy = startY; cy <= endY; cy++) {
      for (let cx = startX; cx <= endX; cx++) {
        // Recompute hash for neighbor cells
        // Note: We duplicate the hash logic here to avoid function call overhead in hot loop
        const hash = ((cx * HASH_X) ^ (cy * HASH_Y)) & (SPATIAL_GRID_SIZE - 1);
        
        // Traverse Linked List
        let id = this.cellHead[hash];
        
        while (id !== -1) {
          outResults.add(id as EntityID);
          id = this.entityNext[id];
        }
      }
    }
  }
}
