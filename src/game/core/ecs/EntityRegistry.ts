import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';
import { ObjectPool } from '../ObjectPool';

class EntityRegistryCore {
  // Active entities (The "Live" List)
  private entities = new Map<EntityID, Entity>();
  private nextId = 0;
  
  private tagCache = new Map<Tag, Set<EntityID>>();

  // The Pool (The "Recycle Bin")
  private entityPool: ObjectPool<Entity>;

  constructor() {
      this.entityPool = new ObjectPool<Entity>(
          () => new Entity(createEntityID(0)), // Factory (ID set later)
          (e) => {}, // Reset (Handled manually in createEntity)
          1000 // Initial Capacity
      );
  }

  public createEntity(): Entity {
    const newId = createEntityID(++this.nextId);
    
    // Acquire from pool
    const entity = this.entityPool.acquire();
    
    // Explicitly reset with new ID
    entity.reset(newId);
    
    this.entities.set(newId, entity);
    return entity;
  }

  public destroyEntity(id: EntityID) {
    const entity = this.entities.get(id);
    if (entity) {
        entity.active = false;
        this.removeFromCache(entity);
        this.entities.delete(id);
        
        // Return to pool
        this.entityPool.release(entity);
    }
  }

  public getEntity(id: EntityID): Entity | undefined {
    return this.entities.get(id);
  }

  public getAll(): IterableIterator<Entity> {
    return this.entities.values();
  }

  public getByTag(tag: Tag): Entity[] {
    if (!this.tagCache.has(tag)) {
        this.rebuildTagCache(tag);
    }
    const ids = this.tagCache.get(tag)!;
    const results: Entity[] = [];
    // We iterate the ID set, but we must check if entity still exists in main map
    // (In case cache is stale within a frame, though we try to keep it sync)
    for (const id of ids) {
        const e = this.entities.get(id);
        if (e && e.active) results.push(e);
    }
    return results;
  }
  
  public updateCache(entity: Entity) {
      for (const tag of entity.tags) {
          if (!this.tagCache.has(tag)) this.tagCache.set(tag, new Set());
          this.tagCache.get(tag)!.add(entity.id);
      }
  }

  private removeFromCache(entity: Entity) {
      for (const tag of entity.tags) {
          if (this.tagCache.has(tag)) {
              this.tagCache.get(tag)!.delete(entity.id);
          }
      }
  }
  
  private rebuildTagCache(tag: Tag) {
      const set = new Set<EntityID>();
      for (const entity of this.entities.values()) {
          if (entity.hasTag(tag)) set.add(entity.id);
      }
      this.tagCache.set(tag, set);
  }

  public clear() {
      // When clearing level, move everything to pool
      for (const entity of this.entities.values()) {
          this.entityPool.release(entity);
      }
      this.entities.clear();
      this.tagCache.clear();
      this.nextId = 0;
  }
  
  // Debug method
  public getStats() {
      return {
          active: this.entities.size,
          pooled: this.entityPool.availableSize,
          totalAllocated: this.entityPool.totalSize
      };
  }
}

export const Registry = new EntityRegistryCore();
