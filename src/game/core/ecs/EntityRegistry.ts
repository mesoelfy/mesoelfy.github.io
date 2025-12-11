import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';
import { ObjectPool } from '../ObjectPool';
import { IEntityRegistry } from '../interfaces';
import { Query, QueryDef } from './Query';

export class EntityRegistry implements IEntityRegistry {
  private entities = new Map<EntityID, Entity>();
  private nextId = 0;
  
  // Tag Cache (Legacy but useful)
  private tagCache = new Map<Tag, Set<EntityID>>();
  
  // Query Cache (New ECS Pattern)
  private activeQueries = new Map<string, { query: Query, results: Set<Entity> }>();

  private entityPool: ObjectPool<Entity>;

  constructor() {
      this.entityPool = new ObjectPool<Entity>(
          () => new Entity(createEntityID(0)),
          (e) => {}, 
          1000 
      );
  }

  public createEntity(): Entity {
    const newId = createEntityID(++this.nextId);
    const entity = this.entityPool.acquire();
    entity.reset(newId);
    this.entities.set(newId, entity);
    return entity;
  }

  public destroyEntity(id: number) {
    const eid = id as EntityID;
    const entity = this.entities.get(eid);
    
    if (!entity || !entity.active) return;

    entity.active = false;
    
    this.removeFromCache(entity);
    this.entities.delete(eid);
    
    entity.release();
    this.entityPool.release(entity);
  }

  public getEntity(id: number): Entity | undefined {
    return this.entities.get(id as EntityID);
  }

  public getAll(): IterableIterator<Entity> {
    return this.entities.values();
  }

  public getByTag(tag: string): Entity[] {
    const t = tag as Tag;
    // Fallback for tags not yet cached (though updateCache should handle this)
    if (!this.tagCache.has(t)) {
        this.tagCache.set(t, new Set());
    }
    
    const ids = this.tagCache.get(t)!;
    const results: Entity[] = [];
    
    for (const id of ids) {
        const e = this.entities.get(id);
        if (e && e.active) results.push(e);
    }
    return results;
  }

  /**
   * Retrieves entities matching a specific component query.
   * Results are cached and auto-updated via updateCache().
   */
  public query(def: QueryDef): Entity[] {
    const tempQ = new Query(def);
    
    // 1. Check if Query already exists
    let cache = this.activeQueries.get(tempQ.id);
    
    if (!cache) {
        // 2. Initial Population (Expensive first run)
        const results = new Set<Entity>();
        const q = new Query(def); // Create persistent instance
        
        for (const entity of this.entities.values()) {
            if (entity.active && q.matches(entity)) {
                results.add(entity);
            }
        }
        
        cache = { query: q, results };
        this.activeQueries.set(q.id, cache);
    }

    // 3. Return Array (Fast iteration)
    // In high-perf scenarios, we might return the Set or an iterator to avoid allocation,
    // but Array is safer for React/Systems copies.
    return Array.from(cache.results);
  }
  
  /**
   * Must be called whenever an Entity's components or tags change.
   * (EntitySpawner calls this automatically)
   */
  public updateCache(entity: Entity) {
      // 1. Update Tags
      for (const tag of entity.tags) {
          if (!this.tagCache.has(tag)) this.tagCache.set(tag, new Set());
          this.tagCache.get(tag)!.add(entity.id);
      }

      // 2. Update Queries
      for (const cache of this.activeQueries.values()) {
          if (cache.query.matches(entity)) {
              cache.results.add(entity);
          } else {
              cache.results.delete(entity);
          }
      }
  }

  private removeFromCache(entity: Entity) {
      // 1. Remove Tags
      for (const tag of entity.tags) {
          if (this.tagCache.has(tag)) {
              this.tagCache.get(tag)!.delete(entity.id);
          }
      }

      // 2. Remove from Queries
      for (const cache of this.activeQueries.values()) {
          cache.results.delete(entity);
      }
  }

  public clear() {
      for (const entity of this.entities.values()) {
          entity.release();
          this.entityPool.release(entity);
      }
      this.entities.clear();
      this.tagCache.clear();
      this.activeQueries.clear();
      this.nextId = 0;
  }
  
  public getStats() {
      return {
          active: this.entities.size,
          pooled: this.entityPool.availableSize,
          totalAllocated: this.entityPool.totalSize
      };
  }
}
