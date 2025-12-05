import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';

class EntityRegistryCore {
  private entities = new Map<EntityID, Entity>();
  private nextId = 0;
  
  // Optimization: Cached lists for common queries
  private tagCache = new Map<Tag, Set<EntityID>>();

  public createEntity(): Entity {
    const id = createEntityID(++this.nextId);
    const entity = new Entity(id);
    this.entities.set(id, entity);
    return entity;
  }

  public destroyEntity(id: EntityID) {
    const entity = this.entities.get(id);
    if (entity) {
        entity.active = false;
        // We defer actual removal to end of frame or cleanup method
        // But for this simple engine, we can remove from map immediately
        // provided we don't mutate while iterating (handled by Systems later)
        this.removeFromCache(entity);
        this.entities.delete(id);
    }
  }

  public getEntity(id: EntityID): Entity | undefined {
    return this.entities.get(id);
  }

  public getAll(): IterableIterator<Entity> {
    return this.entities.values();
  }

  public getByTag(tag: Tag): Entity[] {
    // If not cached, build cache
    if (!this.tagCache.has(tag)) {
        this.rebuildTagCache(tag);
    }
    
    const ids = this.tagCache.get(tag)!;
    const results: Entity[] = [];
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
      this.entities.clear();
      this.tagCache.clear();
      this.nextId = 0;
  }
}

export const Registry = new EntityRegistryCore();
