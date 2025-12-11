import { EntityID, Tag } from './types';
import { Component } from './Component';
import { ComponentPoolManager } from './ComponentPoolManager';

export class Entity {
  public id: EntityID; 
  public readonly tags = new Set<Tag>();
  public active = true;
  public pooled = false;

  public components = new Map<string, Component>();

  constructor(id: EntityID) {
    this.id = id;
  }

  public addComponent(component: Component): this {
    this.components.set(component._type, component);
    return this;
  }

  public getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T;
  }
  
  public requireComponent<T extends Component>(type: string): T {
    const c = this.components.get(type);
    if (!c) throw new Error(`Entity ${this.id} missing required component: ${type}`);
    return c as T;
  }

  public hasComponent(type: string): boolean {
    return this.components.has(type);
  }

  public addTag(tag: Tag): this {
    this.tags.add(tag);
    return this;
  }

  public hasTag(tag: Tag): boolean {
    return this.tags.has(tag);
  }

  // Called when pulled FROM the pool
  public reset(newId: EntityID) {
      this.id = newId;
      this.active = true;
      this.pooled = false;
      // Components are cleared in release(), but safety check:
      this.components.clear();
      this.tags.clear();
  }

  // Called when pushed TO the pool
  public release() {
      this.active = false;
      this.pooled = true;
      
      // Return all components to their respective pools
      for (const component of this.components.values()) {
          ComponentPoolManager.release(component);
      }
      
      this.components.clear(); 
      this.tags.clear();
  }
}
