import { EntityID, createEntityID, Tag } from './types';
import { Entity } from './Entity';
import { ObjectPool } from './ObjectPool';
import { IEntityRegistry } from '../interfaces';
import { Query, QueryDef } from './Query';
import { MAX_ENTITIES } from './Constants';

export class EntityRegistry implements IEntityRegistry {
  private entities = new Map<EntityID, Entity>();
  private nextId = 0;
  private freeIds: number[] = []; 
  private tagCache = new Map<Tag, Set<Entity>>();
  private activeQueries = new Map<string, { query: Query, results: Set<Entity> }>();
  private entityPool: ObjectPool<Entity>;
  private static readonly EMPTY_SET = new Set<Entity>();

  constructor() {
      this.entityPool = new ObjectPool<Entity>(
          () => new Entity(createEntityID(0)),
          () => {}, 
          1000 
      );
  }

  public createEntity(): Entity {
    let idNum = this.freeIds.length > 0 ? this.freeIds.pop()! : ++this.nextId;
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
    return this.tagCache.get(tag as Tag) || EntityRegistry.EMPTY_SET;
  }

  public query(defOrQuery: QueryDef | Query): Iterable<Entity> {
    const query = defOrQuery instanceof Query ? defOrQuery : new Query(defOrQuery);
    let cache = this.activeQueries.get(query.id);
    if (!cache) {
        const results = new Set<Entity>();
        for (const entity of this.entities.values()) {
            if (entity.active && query.matches(entity)) results.add(entity);
        }
        cache = { query, results };
        this.activeQueries.set(query.id, cache);
    }
    return cache.results;
  }
  
  public updateCache(entity: Entity) {
      for (const tag of entity.tags) {
          if (!this.tagCache.has(tag)) this.tagCache.set(tag, new Set());
          this.tagCache.get(tag)!.add(entity);
      }
      for (const cache of this.activeQueries.values()) {
          if (cache.query.matches(entity)) cache.results.add(entity);
          else cache.results.delete(entity);
      }
  }

  private removeFromCache(entity: Entity) {
      for (const tag of entity.tags) {
          if (this.tagCache.has(tag)) this.tagCache.get(tag)!.delete(entity);
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
