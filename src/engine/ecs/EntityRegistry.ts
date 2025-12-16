import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';
import { ObjectPool } from './ObjectPool';
import { IEntityRegistry } from '../interfaces';
import { Query, QueryDef } from './Query';
import { MAX_ENTITIES } from './Constants';

export class EntityRegistry implements IEntityRegistry {
  private entities = new Map<EntityID, Entity>();
  
  // ID Management
  private nextId = 0;
  private freeIds: number[] = []; 
  
  // OPTIMIZATION: Cache Sets of Entities directly, not IDs.
  // This avoids O(N) lookups and Array allocations during getByTag()
  private tagCache = new Map<Tag, Set<Entity>>();
  private activeQueries = new Map<string, { query: Query, results: Set<Entity> }>();
  private entityPool: ObjectPool<Entity>;

  // Reusable empty set to prevent null checks in loops
  private static readonly EMPTY_SET = new Set<Entity>();

  constructor() {
      this.entityPool = new ObjectPool<Entity>(
          () => new Entity(createEntityID(0)),
          (e) => {}, 
          1000 
      );
  }

  public createEntity(): Entity {
    let idNum: number;

    if (this.freeIds.length > 0) {
        idNum = this.freeIds.pop()!;
    } else {
        idNum = ++this.nextId;
    }

    if (idNum >= MAX_ENTITIES) {
        console.warn(`[EntityRegistry] Max Entities Reached (${MAX_ENTITIES}).`);
    }

    const newId = createEntityID(idNum);
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
    this.freeIds.push(id);
    
    entity.release();
    this.entityPool.release(entity);
  }

  public getEntity(id: number): Entity | undefined {
    return this.entities.get(id as EntityID);
  }

  public getAll(): IterableIterator<Entity> {
    return this.entities.values();
  }

  public getByTag(tag: string): Iterable<Entity> {
    const t = tag as Tag;
    return this.tagCache.get(t) || EntityRegistry.EMPTY_SET;
  }

  public query(def: QueryDef): Iterable<Entity> {
    // We create a temporary query object to generate the ID string
    // This is lightweight compared to array allocation
    const tempQ = new Query(def);
    let cache = this.activeQueries.get(tempQ.id);
    
    if (!cache) {
        const results = new Set<Entity>();
        const q = new Query(def); 
        for (const entity of this.entities.values()) {
            if (entity.active && q.matches(entity)) {
                results.add(entity);
            }
        }
        cache = { query: q, results };
        this.activeQueries.set(q.id, cache);
    }
    return cache.results;
  }
  
  public updateCache(entity: Entity) {
      // 1. Update Tag Cache
      for (const tag of entity.tags) {
          if (!this.tagCache.has(tag)) this.tagCache.set(tag, new Set());
          this.tagCache.get(tag)!.add(entity);
      }
      
      // 2. Update Query Cache
      for (const cache of this.activeQueries.values()) {
          if (cache.query.matches(entity)) {
              cache.results.add(entity);
          } else {
              cache.results.delete(entity);
          }
      }
  }

  private removeFromCache(entity: Entity) {
      for (const tag of entity.tags) {
          if (this.tagCache.has(tag)) {
              this.tagCache.get(tag)!.delete(entity);
          }
      }
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
      this.freeIds = [];
  }
  
  public getStats() {
      return {
          active: this.entities.size,
          pooled: this.entityPool.availableSize,
          totalAllocated: this.entityPool.totalSize
      };
  }
}
