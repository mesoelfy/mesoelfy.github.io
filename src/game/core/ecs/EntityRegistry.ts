import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';
import { ObjectPool } from '../ObjectPool';
import { IEntityRegistry } from '../interfaces';

export class EntityRegistry implements IEntityRegistry {
  private entities = new Map<EntityID, Entity>();
  private nextId = 0;
  
  private tagCache = new Map<Tag, Set<EntityID>>();
  private entityPool: ObjectPool<Entity>;

  constructor() {
      // Pool init: 1000 entities pre-allocated
      this.entityPool = new ObjectPool<Entity>(
          () => new Entity(createEntityID(0)),
          (e) => {}, // Reset is handled manually in createEntity
          1000 
      );
  }

  public createEntity(): Entity {
    const newId = createEntityID(++this.nextId);
    const entity = this.entityPool.acquire();
    
    // Strict Reset
    entity.reset(newId);
    
    this.entities.set(newId, entity);
    return entity;
  }

  public destroyEntity(id: number) {
    const eid = id as EntityID;
    const entity = this.entities.get(eid);
    
    // ZOMBIE CHECK: If entity is missing or already inactive, do nothing.
    if (!entity || !entity.active) return;

    // 1. Mark inactive immediately
    entity.active = false;
    
    // 2. Clean up cache
    this.removeFromCache(entity);
    this.entities.delete(eid);
    
    // 3. Prepare for pool
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
    if (!this.tagCache.has(t)) {
        this.rebuildTagCache(t);
    }
    const ids = this.tagCache.get(t)!;
    const results: Entity[] = [];
    
    // Filter active entities only
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
      // Bulk return to pool
      for (const entity of this.entities.values()) {
          entity.release();
          this.entityPool.release(entity);
      }
      this.entities.clear();
      this.tagCache.clear();
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
